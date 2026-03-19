import express from 'express';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';
// generateInvoicePDF loaded dynamically so a broken pdfkit install won't crash the server
let generateInvoicePDF = null;
import('../utils/generateInvoicePDF.js').then(m => { generateInvoicePDF = m.default; }).catch(err => {
  console.warn('⚠️  PDF generation disabled (pdfkit issue):', err.message);
});
import { sendWhatsAppMessage, sendWhatsAppDocument, getWAStatus } from '../services/whatsapp.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// ── number to words ──
function numberToWords(num) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (num === 0) return 'Zero';
  if (num < 20)  return ones[num];
  if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? ' '+ones[num%10] : '');
  if (num < 1000)    return ones[Math.floor(num/100)]+' Hundred'+(num%100?' '+numberToWords(num%100):'');
  if (num < 100000)  return numberToWords(Math.floor(num/1000))+' Thousand'+(num%1000?' '+numberToWords(num%1000):'');
  if (num < 10000000)return numberToWords(Math.floor(num/100000))+' Lakh'+(num%100000?' '+numberToWords(num%100000):'');
  return numberToWords(Math.floor(num/10000000))+' Crore'+(num%10000000?' '+numberToWords(num%10000000):'');
}

// ── WhatsApp message builder ──
function buildAdminMessage(order) {
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  let itemsText = '';
  order.items.forEach((item, idx) => {
    itemsText += `\n${idx+1}. *${item.name}*\n   Code: ${item.itemCode} | HSN: ${item.hsnCode||'N/A'}\n   Qty: ${item.quantity} PAC × ₹${item.price} = *₹${item.amount}*`;
  });
  const amountInWords = numberToWords(Math.round(order.total));

  return `🦅 *NEW ORDER — ADIYOGI INTERNATIONAL*
━━━━━━━━━━━━━━━━━━━
📋 *Order ID: ${order.orderId}*
📅 Date: ${date}
💳 Payment: ${order.paymentMode}

━━━━━━━━━━━━━━━━━━━
👤 *CUSTOMER*
━━━━━━━━━━━━━━━━━━━
Name: ${order.customer.name}
Phone: ${order.customer.phone}
WhatsApp: ${order.customer.whatsapp||order.customer.phone}
Address: ${order.customer.address}
${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}

━━━━━━━━━━━━━━━━━━━
🛒 *ITEMS ORDERED*
━━━━━━━━━━━━━━━━━━━${itemsText}

━━━━━━━━━━━━━━━━━━━
💰 *TOTAL: ₹${order.total.toFixed(2)}*
GST: Included in price
Subtotal: ₹${order.subtotal.toFixed(2)}

📝 ${amountInWords} Rupees Only
━━━━━━━━━━━━━━━━━━━
_(Invoice PDF sent separately)_`;
}

function buildCustomerMessage(order) {
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  let itemsText = '';
  order.items.forEach((item, idx) => {
    itemsText += `\n${idx+1}. *${item.name}* — ${item.quantity} PAC = ₹${item.amount}`;
  });

  return `🦅 *ADIYOGI INTERNATIONAL*
_"Come Experience the Quality"_
━━━━━━━━━━━━━━━━━━━

✅ *ORDER CONFIRMED!*
📋 Order ID: *${order.orderId}*
📅 Date: ${date}

━━━━━━━━━━━━━━━━━━━
🛒 *YOUR ITEMS*
━━━━━━━━━━━━━━━━━━━${itemsText}

━━━━━━━━━━━━━━━━━━━
💰 *TOTAL: ₹${order.total.toFixed(2)}*

📍 Delivery to: ${order.customer.city}, ${order.customer.state}

Your invoice PDF has been sent separately. 📄
We'll process your order shortly! 🙏

Thank you for choosing Adiyogi International 🦅`;
}

// ── PUBLIC: Place order ──
router.post('/', async (req, res) => {
  try {
    const { customer, items: cartItems, paymentMode } = req.body;

    // Build order items
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cartItems) {
      const product = await Product.findById(cartItem.productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${cartItem.productId}` });
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

    // ── Generate PDF invoice ──
    let pdfFilePath = null;
    let pdfFileUrl  = null;
    try {
      const { fileUrl } = generateInvoicePDF ? await generateInvoicePDF(order) : { fileUrl: null };
      pdfFileUrl  = fileUrl;  // e.g. /uploads/invoices/ADI-0001.pdf
      pdfFilePath = join(__dirname, '..', fileUrl.replace(/^\//, ''));
    } catch (pdfErr) {
      console.error('PDF generation failed (non-fatal):', pdfErr.message);
    }

    // ── Auto-send WhatsApp via server ──
    const waStatus = getWAStatus();
    let adminSent    = false;
    let customerSent = false;

    if (waStatus.isReady) {
      const adminRecord = await Admin.findOne().select('whatsappNumber');
      const adminPhone  = adminRecord?.whatsappNumber || process.env.ADMIN_WHATSAPP;

      const adminMsg    = buildAdminMessage(order);
      const customerMsg = buildCustomerMessage(order);

      // Send text messages in parallel
      const [aSent, cSent] = await Promise.all([
        adminPhone ? sendWhatsAppMessage(adminPhone, adminMsg)        : Promise.resolve(false),
        sendWhatsAppMessage(customer.whatsapp || customer.phone, customerMsg),
      ]);
      adminSent    = aSent;
      customerSent = cSent;

      // Send PDF to both (non-blocking)
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

  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── PUBLIC: Download invoice PDF ──
router.get('/:id/invoice', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const filePath = join(__dirname, '..', 'uploads', 'invoices', `${order.orderId}.pdf`);
    if (!existsSync(filePath) && generateInvoicePDF) await generateInvoicePDF(order);

    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.orderId}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.download(filePath, `Invoice-${order.orderId}.pdf`);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUBLIC: Get order by ID ──
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
