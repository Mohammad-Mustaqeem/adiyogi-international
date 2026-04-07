import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// fileName convention used externally (e.g. for WhatsApp attachment name)
export function invoiceFileName(order) {
  return `Invoice-${order.orderId}.pdf`;
}

function numberToWords(num) {
  num = Math.floor(num); // guard against decimals — only whole rupees
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
}

/**
 * Generate a PDF invoice for the given order.
 * Returns a Buffer — nothing is written to disk.
 *
 * @param {object} order  Mongoose order document
 * @returns {Promise<Buffer>}
 */
async function generateInvoicePDF(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc    = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];
      doc.on('data',  (chunk) => chunks.push(chunk));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Colors & helpers ──
      const NAVY   = '#1B3A6B';
      const GOLD   = '#C9A84C';
      const LIGHT  = '#EEF1F8';
      const DARK   = '#1A1A2E';
      const GRAY   = '#6B7280';

      const W = 515; // usable width (595 - 40*2)
      const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric'
      });

      // ── HEADER ──
      // Navy background bar
      doc.rect(0, 0, 595, 110).fill(NAVY);

      // Try to add logo (if exists)
      const logoPath = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 40, 15, { height: 75 });
        } catch (e) { /* skip if image fails */ }
      }

      // Company name & tagline (right side of header)
      doc.fillColor('white')
        .fontSize(22).font('Helvetica-Bold')
        .text('ADIYOGI INTERNATIONAL', 0, 28, { align: 'right', width: 555 });
      doc.fontSize(10).font('Helvetica-Oblique').fillColor(GOLD)
        .text('"Come Experience the Quality"', 0, 55, { align: 'right', width: 555 });
      doc.fontSize(9).font('Helvetica').fillColor('#CBD5E1')
        .text('Tax Invoice', 0, 72, { align: 'right', width: 555 });

      // ── INVOICE META ──
      doc.rect(0, 110, 595, 38).fill(GOLD);
      doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
        .text(`INVOICE: ${order.orderId}`, 40, 122);
      doc.fontSize(11).font('Helvetica')
        .text(`Date: ${date}   |   Payment: ${order.paymentMode}`, 0, 124, { align: 'right', width: 555 });

      // ── ADDRESSES ──
      const addrTop = 168;
      // From
      doc.rect(40, addrTop, 230, 95).fill(LIGHT).stroke();
      doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold')
        .text('FROM:', 52, addrTop + 10);
      doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
        .text('Adiyogi International', 52, addrTop + 24);
      doc.fontSize(9).font('Helvetica').fillColor(GRAY)
        .text('India', 52, addrTop + 38)
        .text('GSTIN: Applied For', 52, addrTop + 52);

      // To
      doc.rect(285, addrTop, 270, 95).fill(LIGHT).stroke();
      doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold')
        .text('BILL TO:', 297, addrTop + 10);
      doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
        .text(order.customer.name, 297, addrTop + 24);
      doc.fontSize(9).font('Helvetica').fillColor(GRAY)
        .text(`Ph: ${order.customer.phone}`, 297, addrTop + 38);
      const addr = `${order.customer.address}, ${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}`;
      doc.text(addr, 297, addrTop + 52, { width: 248, lineGap: 2 });

      // ── ITEMS TABLE ──
      const tTop = addrTop + 115;
      const cols = { num: 40, name: 65, code: 220, hsn: 290, qty: 355, unit: 390, price: 430, amount: 480 };

      // Table header
      doc.rect(40, tTop, W, 24).fill(NAVY);
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
      doc.text('#',         cols.num,   tTop + 8);
      doc.text('Item Name', cols.name,  tTop + 8);
      doc.text('Code',      cols.code,  tTop + 8);
      doc.text('HSN/SAC',   cols.hsn,   tTop + 8);
      doc.text('Qty',       cols.qty,   tTop + 8);
      doc.text('Unit',      cols.unit,  tTop + 8);
      doc.text('Price',     cols.price, tTop + 8);
      doc.text('Amount',    cols.amount,tTop + 8);

      // Table rows
      let rowY = tTop + 24;
      let totalQty = 0;

      order.items.forEach((item, idx) => {
        const bg = idx % 2 === 0 ? 'white' : '#F8FAFF';
        doc.rect(40, rowY, W, 26).fill(bg);

        doc.fillColor(DARK).fontSize(8).font('Helvetica');
        doc.text(String(idx + 1),            cols.num,    rowY + 9);
        doc.text(item.name,                  cols.name,   rowY + 9, { width: 150, lineBreak: false });
        doc.text(item.itemCode || '',        cols.code,   rowY + 9, { width: 65,  lineBreak: false });
        doc.text(item.hsnCode  || '',        cols.hsn,    rowY + 9, { width: 60,  lineBreak: false });
        doc.text(String(item.quantity),      cols.qty,    rowY + 9);
        doc.text(item.unit || 'Nos',         cols.unit,   rowY + 9);
        doc.text(`Rs ${item.price}`,         cols.price,  rowY + 9, { width: 45, align: 'right' });
        doc.text(`Rs ${item.amount}`,        cols.amount, rowY + 9, { width: 50, align: 'right' });

        totalQty += item.quantity;
        rowY += 26;
      });

      // Table total row
      doc.rect(40, rowY, W, 26).fill(LIGHT);
      doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold')
        .text('TOTAL', cols.name, rowY + 8)
        .text(String(totalQty), cols.qty, rowY + 8)
        .text(`Rs ${order.total.toFixed(2)}`, cols.amount, rowY + 8, { width: 50, align: 'right' });
      rowY += 26;

      // Table border
      doc.rect(40, tTop, W, rowY - tTop).stroke('#D1D5DB');

      // ── SUMMARY BOX ──
      const sumTop = rowY + 20;
      // Amount in words (left)
      doc.rect(40, sumTop, 290, 80).fill(LIGHT).stroke('#D1D5DB');
      doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold')
        .text('Invoice Amount in Words:', 52, sumTop + 12);
      const amtWords = numberToWords(Math.round(order.total)) + ' Rupees Only';
      doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
        .text(amtWords, 52, sumTop + 28, { width: 266, lineGap: 2 });
      doc.fillColor(GRAY).fontSize(9).font('Helvetica')
        .text(`Payment Mode: ${order.paymentMode}`, 52, sumTop + 58);

      // Amounts (right)
      doc.rect(345, sumTop, 210, 80).fill(LIGHT).stroke('#D1D5DB');
      doc.fillColor(GRAY).fontSize(9).font('Helvetica').text('Sub Total', 357, sumTop + 12);
      doc.fillColor(DARK).fontSize(9).font('Helvetica').text(`Rs ${order.subtotal.toFixed(2)}`, 345, sumTop + 12, { width: 198, align: 'right' });
      doc.fillColor(GRAY).fontSize(8).font('Helvetica').text('(GST Included)', 357, sumTop + 30);
      // Total line
      doc.rect(345, sumTop + 56, 210, 24).fill(NAVY);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
        .text('TOTAL', 357, sumTop + 63)
        .text(`Rs ${order.total.toFixed(2)}`, 345, sumTop + 63, { width: 198, align: 'right' });

      // ── FOOTER ──
      const footerY = doc.page.height - 70;
      doc.rect(0, footerY, 595, 70).fill(NAVY);
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
        .text('Thank you for your business!', 40, footerY + 14);
      doc.fillColor(GOLD).fontSize(8).font('Helvetica-Oblique')
        .text('"Come Experience the Quality" — Adiyogi International', 40, footerY + 30);
      doc.fillColor('#94A3B8').fontSize(8).font('Helvetica')
        .text(`Generated on ${new Date().toLocaleString('en-IN')}`, 40, footerY + 46);
      doc.fillColor('white').fontSize(9)
        .text(`Order ID: ${order.orderId}`, 0, footerY + 46, { align: 'right', width: 555 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default generateInvoicePDF;
