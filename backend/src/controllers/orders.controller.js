import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { buildAdminMessage, buildCustomerMessage } from '../utils/helpers.js';
import { sendWhatsAppMessage, sendWhatsAppDocument, getWAStatus } from '../services/whatsapp.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lazy-load PDF generation so a broken pdfkit install won't crash the server
let generateInvoicePDF = null;
import('../utils/generateInvoicePDF.js').then(m => { generateInvoicePDF = m.default; }).catch(err => {
  console.warn('⚠️  PDF generation disabled (pdfkit issue):', err.message);
});

export const createOrder = asyncHandler(async (req, res) => {
  const { customer, items: cartItems, paymentMode } = req.body;

  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cartItems) {
    const product = await Product.findById(cartItem.productId);
    if (!product) throw new ApiError(404, `Product not found: ${cartItem.productId}`);
    const amount = product.salesPrice * cartItem.quantity;
    subtotal += amount;
    orderItems.push({
      product:            product._id,
      name:               product.name,
      itemCode:           product.itemCode,
      hsnCode:            product.hsnCode,
      place:              product.place,
      unit:               'PAC',
      unitConversionRate: product.unitConversionRate || 10,
      quantity:           cartItem.quantity,
      price:              product.salesPrice,
      amount,
    });
  }

  const total = subtotal;
  const order = new Order({
    customer,
    items: orderItems,
    subtotal, gstTotal: 0, total,
    paymentMode: paymentMode || 'Credit',
  });
  await order.save();

  // Generate PDF invoice
  let pdfFilePath = null;
  let pdfFileUrl  = null;
  try {
    const { fileUrl } = generateInvoicePDF ? await generateInvoicePDF(order) : { fileUrl: null };
    pdfFileUrl  = fileUrl;
    pdfFilePath = join(__dirname, '..', fileUrl.replace(/^\//, ''));
  } catch (pdfErr) {
    console.error('PDF generation failed (non-fatal):', pdfErr.message);
  }

  // Auto-send WhatsApp via server
  const waStatus = getWAStatus();
  let adminSent    = false;
  let customerSent = false;

  if (waStatus.isReady) {
    const adminRecord = await Admin.findOne().select('whatsappNumber');
    const adminPhone  = adminRecord?.whatsappNumber || process.env.ADMIN_WHATSAPP;

    const adminMsg    = buildAdminMessage(order);
    const customerMsg = buildCustomerMessage(order);

    const [aSent, cSent] = await Promise.all([
      adminPhone ? sendWhatsAppMessage(adminPhone, adminMsg)        : Promise.resolve(false),
      sendWhatsAppMessage(customer.whatsapp || customer.phone, customerMsg),
    ]);
    adminSent    = aSent;
    customerSent = cSent;

    if (pdfFilePath && existsSync(pdfFilePath)) {
      const pdfCaption = `📄 Invoice for Order ${order.orderId}`;
      if (adminPhone) sendWhatsAppDocument(adminPhone, pdfFilePath, `Invoice-${order.orderId}.pdf`, pdfCaption);
      sendWhatsAppDocument(customer.whatsapp || customer.phone, pdfFilePath, `Invoice-${order.orderId}.pdf`, pdfCaption);
    }
  } else {
    console.log('⚠️  WhatsApp not connected — scan QR in admin panel to enable auto-send');
  }

  res.status(201).json({
    order,
    pdfUrl: pdfFileUrl,
    autoSent: { admin: adminSent, customer: customerSent, waReady: waStatus.isReady },
  });
});

export const getOrderInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw new ApiError(404, 'Order not found');

  const filePath = join(__dirname, '..', 'uploads', 'invoices', `${order.orderId}.pdf`);
  if (!existsSync(filePath) && generateInvoicePDF) await generateInvoicePDF(order);

  res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.orderId}.pdf"`);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.download(filePath, `Invoice-${order.orderId}.pdf`);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw new ApiError(404, 'Order not found');
  res.json(order);
});
