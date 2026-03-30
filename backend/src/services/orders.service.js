import mongoose from 'mongoose';
import { ApiError } from '../utils/api-error.js';
import { buildAdminMessage, buildCustomerMessage } from '../utils/helpers.js';
import * as orderRepo from '../repositories/order.repository.js';
import * as productRepo from '../repositories/product.repository.js';
import * as adminRepo from '../repositories/admin.repository.js';
import { sendWhatsAppMessage, sendWhatsAppDocumentBuffer, getWAStatus } from './whatsapp.service.js';
import { uploadInvoicePdf } from './imagekit.service.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// Lazy-load PDF generation so a broken pdfkit install won't crash the server
let generateInvoicePDF = null;
import('../utils/generate-invoice-pdf.js')
  .then((m) => { generateInvoicePDF = m.default; })
  .catch((err) => { logger.warn({ err }, 'PDF generation disabled (pdfkit issue)'); });

// Check once at startup whether the connection supports transactions (replica set)
let _supportsTransactions = null;
async function supportsTransactions() {
  if (_supportsTransactions !== null) return _supportsTransactions;
  try {
    const admin = mongoose.connection.db.admin();
    const info = await admin.command({ replSetGetStatus: 1 });
    _supportsTransactions = !!(info && info.ok);
  } catch {
    _supportsTransactions = false;
  }
  return _supportsTransactions;
}

export async function createOrder({ customer, items: cartItems, paymentMode }) {
  const useTransaction = await supportsTransactions();
  const session = useTransaction ? await mongoose.startSession() : null;

  try {
    let order;

    const runOrderCreation = async (txnSession) => {
      const productIds = cartItems.map((item) => item.productId);
      const products   = await productRepo.findByIds(productIds, { session: txnSession });
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      const orderItems = [];
      let subtotal = 0;

      for (const cartItem of cartItems) {
        const product = productMap.get(cartItem.productId.toString());
        if (!product) throw new ApiError(404, `Product not found: ${cartItem.productId}`);
        const amount = product.salesPrice * cartItem.quantity;
        subtotal += amount;
        orderItems.push({
          product: product._id,
          name: product.name,
          itemCode: product.itemCode,
          hsnCode: product.hsnCode,
          place: product.place,
          unit: 'PAC',
          unitConversionRate: product.unitConversionRate || 10,
          quantity: cartItem.quantity,
          price: product.salesPrice,
          amount,
        });
      }

      order = await orderRepo.create(
        {
          customer,
          items: orderItems,
          subtotal,
          gstTotal: 0,
          total: subtotal,
          paymentMode: paymentMode || 'Credit',
        },
        { session: txnSession },
      );

      // Deduct stock for each ordered item (atomic with the order in transactions)
      await Promise.all(
        orderItems.map((item) =>
          productRepo.decrementStock(item.product, item.quantity, { session: txnSession }),
        ),
      );
    };

    if (session) {
      await session.withTransaction(() => runOrderCreation(session));
    } else {
      await runOrderCreation(null);
    }

    // --- Side effects (outside transaction) ---

    // Generate PDF buffer and upload to ImageKit
    let pdfBuffer    = null;
    let invoiceUrl   = null;

    try {
      if (generateInvoicePDF) {
        pdfBuffer = await generateInvoicePDF(order);
        const uploaded = await uploadInvoicePdf(pdfBuffer, order.orderId);
        invoiceUrl = uploaded.url;

        // Persist CDN URL and fileId on the order
        await orderRepo.update(order._id, {
          invoiceUrl:    uploaded.url,
          invoiceFileId: uploaded.fileId,
        });
        order.invoiceUrl   = uploaded.url;
        order.invoiceFileId = uploaded.fileId;
      }
    } catch (pdfErr) {
      logger.error({ err: pdfErr }, 'Invoice generation/upload failed (non-fatal)');
    }

    // Auto-send WhatsApp
    const waStatus = getWAStatus();
    let adminSent    = false;
    let customerSent = false;

    if (waStatus.isReady) {
      const adminRecord = await adminRepo.findOneAdmin({}, 'whatsappNumber');
      const adminPhone  = adminRecord?.whatsappNumber || env.ADMIN_WHATSAPP;

      const adminMsg    = buildAdminMessage(order);
      const customerMsg = buildCustomerMessage(order);

      const [aSent, cSent] = await Promise.all([
        adminPhone ? sendWhatsAppMessage(adminPhone, adminMsg) : Promise.resolve(false),
        sendWhatsAppMessage(customer.whatsapp || customer.phone, customerMsg),
      ]);
      adminSent    = aSent;
      customerSent = cSent;

      // Send PDF buffer as WhatsApp document attachment
      if (pdfBuffer) {
        const pdfCaption = `Invoice for Order ${order.orderId}`;
        const pdfName    = `Invoice-${order.orderId}.pdf`;
        const pdfSends = [];
        if (adminPhone) pdfSends.push(sendWhatsAppDocumentBuffer(adminPhone, pdfBuffer, pdfName, pdfCaption));
        pdfSends.push(sendWhatsAppDocumentBuffer(customer.whatsapp || customer.phone, pdfBuffer, pdfName, pdfCaption));
        await Promise.all(pdfSends).catch((err) => logger.warn({ err }, 'WhatsApp PDF send failed (non-fatal)'));
      }
    } else {
      logger.info('WhatsApp not connected — scan QR in admin panel to enable auto-send');
    }

    return {
      order,
      pdfUrl: invoiceUrl,
      autoSent: { admin: adminSent, customer: customerSent, waReady: waStatus.isReady },
    };
  } finally {
    if (session) await session.endSession();
  }
}

export async function getOrderById(id) {
  const order = await orderRepo.findById(id);
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
}

export async function getOrderInvoice(id) {
  const order = await orderRepo.findById(id);
  if (!order) throw new ApiError(404, 'Order not found');

  // Return CDN URL if already uploaded
  if (order.invoiceUrl) return { order, invoiceUrl: order.invoiceUrl };

  // Otherwise generate on-demand and upload
  if (!generateInvoicePDF) throw new ApiError(503, 'PDF generation is unavailable');

  const pdfBuffer = await generateInvoicePDF(order);
  const uploaded  = await uploadInvoicePdf(pdfBuffer, order.orderId);

  await orderRepo.update(order._id, {
    invoiceUrl:    uploaded.url,
    invoiceFileId: uploaded.fileId,
  });

  return { order, invoiceUrl: uploaded.url };
}
