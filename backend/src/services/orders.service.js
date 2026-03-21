import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { ApiError } from '../utils/api-error.js';
import { buildAdminMessage, buildCustomerMessage } from '../utils/helpers.js';
import * as orderRepo from '../repositories/order.repository.js';
import * as productRepo from '../repositories/product.repository.js';
import * as adminRepo from '../repositories/admin.repository.js';
import { sendWhatsAppMessage, sendWhatsAppDocument, getWAStatus } from './whatsapp.service.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
      // Batch-fetch all products in a single query
      const productIds = cartItems.map((item) => item.productId);
      const products = await productRepo.findByIds(productIds, { session: txnSession });

      // Build a lookup map for O(1) access
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

      const total = subtotal;
      order = await orderRepo.create(
        {
          customer,
          items: orderItems,
          subtotal,
          gstTotal: 0,
          total,
          paymentMode: paymentMode || 'Credit',
        },
        { session: txnSession },
      );
    };

    if (session) {
      await session.withTransaction(() => runOrderCreation(session));
    } else {
      await runOrderCreation(null);
    }

    // --- Side effects (outside transaction) ---

    // Generate PDF invoice
    let pdfFilePath = null;
    let pdfFileUrl = null;
    try {
      const { fileUrl } = generateInvoicePDF ? await generateInvoicePDF(order) : { fileUrl: null };
      pdfFileUrl = fileUrl;
      pdfFilePath = join(__dirname, '..', fileUrl.replace(/^\//, ''));
    } catch (pdfErr) {
      logger.error({ err: pdfErr }, 'PDF generation failed (non-fatal)');
    }

    // Auto-send WhatsApp via server
    const waStatus = getWAStatus();
    let adminSent = false;
    let customerSent = false;

    if (waStatus.isReady) {
      const adminRecord = await adminRepo.findOneAdmin({}, 'whatsappNumber');
      const adminPhone = adminRecord?.whatsappNumber || env.ADMIN_WHATSAPP;

      const adminMsg = buildAdminMessage(order);
      const customerMsg = buildCustomerMessage(order);

      const [aSent, cSent] = await Promise.all([
        adminPhone ? sendWhatsAppMessage(adminPhone, adminMsg) : Promise.resolve(false),
        sendWhatsAppMessage(customer.whatsapp || customer.phone, customerMsg),
      ]);
      adminSent = aSent;
      customerSent = cSent;

      if (pdfFilePath && existsSync(pdfFilePath)) {
        const pdfCaption = `Invoice for Order ${order.orderId}`;
        if (adminPhone) sendWhatsAppDocument(adminPhone, pdfFilePath, `Invoice-${order.orderId}.pdf`, pdfCaption);
        sendWhatsAppDocument(customer.whatsapp || customer.phone, pdfFilePath, `Invoice-${order.orderId}.pdf`, pdfCaption);
      }
    } else {
      logger.info('WhatsApp not connected — scan QR in admin panel to enable auto-send');
    }

    return {
      order,
      pdfUrl: pdfFileUrl,
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

  const filePath = join(__dirname, '..', 'uploads', 'invoices', `${order.orderId}.pdf`);
  if (!existsSync(filePath) && generateInvoicePDF) await generateInvoicePDF(order);

  return { order, filePath };
}
