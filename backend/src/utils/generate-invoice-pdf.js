import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

export function invoiceFileName(order) {
  return `Estimate-${order.orderId}.pdf`;
}

// ── Number → Indian words ─────────────────────────────────────────
function numberToWords(num) {
  num = Math.floor(num);
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  if (num < 20)  return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000)     return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000)   return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
}

// ── Page layout ───────────────────────────────────────────────────
const PAGE_W = 595;
const PAGE_H = 842;
const MX     = 40;          // left/right margin
const W      = PAGE_W - MX * 2; // 515 usable width

const FOOTER_H = 70;
const FOOTER_Y = PAGE_H - FOOTER_H;

const HEADER_H     = 110;
const META_H       = 38;
const ADDR_TOP     = HEADER_H + META_H + 20;
const ADDR_H       = 95;
const TABLE_TOP_P1 = ADDR_TOP + ADDR_H + 20;

const TABLE_HDR_H = 24;
const ROW_H       = 26;
const CELL_PAD    = 6;   // ← universal horizontal padding inside every cell

const SUMMARY_H   = 80;
const SUMMARY_GAP = 20;

const CONT_HDR_H     = 50;
const TABLE_TOP_CONT = CONT_HDR_H;

const ROW_BREAK_Y = FOOTER_Y - ROW_H - SUMMARY_GAP - SUMMARY_H - SUMMARY_GAP;

// ── Column definitions ────────────────────────────────────────────
// Each column: { x: left edge of cell, w: cell width }
// Text is drawn at (x + CELL_PAD) for left-aligned, or using pdfkit
// align:'right' with width (w - CELL_PAD*2) for right-aligned.
// Columns are packed to fill W = 515 exactly.
//
//  #    │ Item Name      │ Code  │ HSN   │ Qty │ Unit │ Price │ Amount
//  18px │ 165px          │ 65px  │ 60px  │35px │ 40px │ 62px  │ 70px
//  = 515px total
const COLS = {
  num:    { x: MX,       w: 18  },
  name:   { x: MX + 18,  w: 165 },
  code:   { x: MX + 183, w: 65  },
  hsn:    { x: MX + 248, w: 60  },
  qty:    { x: MX + 308, w: 35  },
  unit:   { x: MX + 343, w: 40  },
  price:  { x: MX + 383, w: 62  },
  amount: { x: MX + 445, w: 70  },
};
// Verify: 18+165+65+60+35+40+62+70 = 515 ✓

// ── Helper: draw text in a cell with correct padding ──────────────
// align = 'left' | 'right' | 'center'
function cellText(doc, col, y, text, opts = {}) {
  const { align = 'left', ...rest } = opts;
  const textX = align === 'right'
    ? col.x                              // pdfkit right-aligns within width
    : col.x + CELL_PAD;
  const textW = col.w - CELL_PAD * 2;
  doc.text(String(text), textX, y, { width: textW, align, lineBreak: false, ...rest });
}

// ── Colors ────────────────────────────────────────────────────────
const NAVY  = '#1B3A6B';
const GOLD  = '#C9A84C';
const LIGHT = '#EEF1F8';
const DARK  = '#1A1A2E';
const GRAY  = '#6B7280';

// ── Section drawers ───────────────────────────────────────────────
function drawFirstPageHeader(doc, order) {
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  doc.rect(0, 0, PAGE_W, HEADER_H).fill(NAVY);

  const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
  if (fs.existsSync(logoPath)) {
    try { doc.image(logoPath, 40, 15, { height: 75 }); } catch {}
  }

  doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
    .text('ADIYOGI INTERNATIONAL', 0, 28, { align: 'right', width: 555 });
  doc.fontSize(10).font('Helvetica-Oblique').fillColor(GOLD)
    .text('"Come Experience the Quality"', 0, 55, { align: 'right', width: 555 });
  doc.fontSize(9).font('Helvetica').fillColor('#CBD5E1')
    .text('Tax Invoice', 0, 72, { align: 'right', width: 555 });

  doc.rect(0, HEADER_H, PAGE_W, META_H).fill(GOLD);
  doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
    .text(`ESTIMATE: ${order.orderId}`, 40, 122);
  doc.fontSize(11).font('Helvetica')
    .text(`Date: ${date}   |   Payment: ${order.paymentMode}`, 0, 124, { align: 'right', width: 555 });

  doc.rect(40, ADDR_TOP, 230, ADDR_H).fill(LIGHT).stroke();
  doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold').text('FROM:', 52, ADDR_TOP + 10);
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Adiyogi International', 52, ADDR_TOP + 24);
  doc.fontSize(9).font('Helvetica').fillColor(GRAY)
    .text('India', 52, ADDR_TOP + 38)
    .text('GSTIN: Applied For', 52, ADDR_TOP + 52);

  doc.rect(285, ADDR_TOP, 270, ADDR_H).fill(LIGHT).stroke();
  doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold').text('BILL TO:', 297, ADDR_TOP + 10);
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text(order.customer.name, 297, ADDR_TOP + 24);
}

function drawContinuationHeader(doc, order) {
  doc.rect(0, 0, PAGE_W, CONT_HDR_H).fill(NAVY);
  doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
    .text('ADIYOGI INTERNATIONAL', 40, 14);
  doc.fillColor(GOLD).fontSize(9).font('Helvetica')
    .text(`ESTIMATE: ${order.orderId}  (continued)`, 0, 14, { align: 'right', width: 555 });
  doc.fillColor('#CBD5E1').fontSize(8).font('Helvetica')
    .text('Tax Invoice', 0, 30, { align: 'right', width: 555 });
}

function drawTableHeader(doc, tTop) {
  doc.rect(MX, tTop, W, TABLE_HDR_H).fill(NAVY);
  doc.fillColor('white').fontSize(8).font('Helvetica-Bold');

  const ty = tTop + 8;
  cellText(doc, COLS.num,    ty, '#',         { align: 'center' });
  cellText(doc, COLS.name,   ty, 'Item Name');
  cellText(doc, COLS.code,   ty, 'Code');
  cellText(doc, COLS.hsn,    ty, 'HSN/SAC');
  cellText(doc, COLS.qty,    ty, 'Qty',       { align: 'center' });
  cellText(doc, COLS.unit,   ty, 'Unit',      { align: 'center' });
  cellText(doc, COLS.price,  ty, 'Price',     { align: 'right' });
  cellText(doc, COLS.amount, ty, 'Amount',    { align: 'right' });

  return tTop + TABLE_HDR_H;
}

function drawItemRow(doc, item, idx, rowY) {
  doc.rect(MX, rowY, W, ROW_H).fill(idx % 2 === 0 ? 'white' : '#F8FAFF');
  doc.fillColor(DARK).fontSize(8).font('Helvetica');

  const ty = rowY + 9;
  cellText(doc, COLS.num,    ty, idx + 1,              { align: 'center' });
  cellText(doc, COLS.name,   ty, item.name);
  cellText(doc, COLS.code,   ty, item.itemCode  || '');
  cellText(doc, COLS.hsn,    ty, item.hsnCode   || '');
  cellText(doc, COLS.qty,    ty, item.quantity,         { align: 'center' });
  cellText(doc, COLS.unit,   ty, item.unit || 'Nos',    { align: 'center' });
  cellText(doc, COLS.price,  ty, `Rs ${item.price}`,   { align: 'right' });
  cellText(doc, COLS.amount, ty, `Rs ${item.amount}`,  { align: 'right' });
}

function drawTotalRow(doc, totalQty, order, rowY) {
  doc.rect(MX, rowY, W, ROW_H).fill(LIGHT);
  doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold');

  const ty = rowY + 8;
  cellText(doc, COLS.name,   ty, 'TOTAL');
  cellText(doc, COLS.qty,    ty, totalQty,                        { align: 'center' });
  cellText(doc, COLS.amount, ty, `Rs ${order.total.toFixed(2)}`, { align: 'right' });
}

function drawVerticalCellBorders(doc, tableStartY, rowY) {
  // Draw vertical dividers between every column for the data rows
  doc.strokeColor('#D1D5DB').lineWidth(0.5);
  const borderCols = [COLS.name, COLS.code, COLS.hsn, COLS.qty, COLS.unit, COLS.price, COLS.amount];
  for (const col of borderCols) {
    doc.moveTo(col.x, tableStartY).lineTo(col.x, rowY).stroke();
  }
  // Outer border
  doc.rect(MX, tableStartY, W, rowY - tableStartY).stroke('#D1D5DB');
}

function drawFooter(doc, order) {
  doc.rect(0, FOOTER_Y, PAGE_W, FOOTER_H).fill(NAVY);
  doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
    .text('Thank you for your business!', 40, FOOTER_Y + 12);
  doc.fillColor(GOLD).fontSize(8).font('Helvetica-Oblique')
    .text('"Come Experience the Quality" — Adiyogi International', 40, FOOTER_Y + 28);
  doc.fillColor('#94A3B8').fontSize(8).font('Helvetica')
    .text(`Generated on ${new Date().toLocaleString('en-IN')}`, 40, FOOTER_Y + 44);
  doc.fillColor('white').fontSize(9).font('Helvetica')
    .text(`Order ID: ${order.orderId}`, 0, FOOTER_Y + 44, { align: 'right', width: 555 });
}

// ── Main export ───────────────────────────────────────────────────
async function generateInvoicePDF(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 0, size: 'A4' });
      const chunks = [];
      doc.on('data',  (c) => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      drawFirstPageHeader(doc, order);
      let tableStartY = TABLE_TOP_P1;
      let rowY = drawTableHeader(doc, tableStartY);
      let totalQty = 0;

      for (let idx = 0; idx < order.items.length; idx++) {
        const item = order.items[idx];

        if (rowY + ROW_H > ROW_BREAK_Y) {
          drawVerticalCellBorders(doc, tableStartY, rowY);
          drawFooter(doc, order);
          doc.addPage();
          drawContinuationHeader(doc, order);
          tableStartY = TABLE_TOP_CONT;
          rowY = drawTableHeader(doc, tableStartY);
        }

        drawItemRow(doc, item, idx, rowY);
        totalQty += item.quantity;
        rowY += ROW_H;
      }

      drawTotalRow(doc, totalQty, order, rowY);
      rowY += ROW_H;

      drawVerticalCellBorders(doc, tableStartY, rowY);

      const needSummaryY = rowY + SUMMARY_GAP + SUMMARY_H;
      if (needSummaryY > FOOTER_Y) {
        drawFooter(doc, order);
        doc.addPage();
        drawContinuationHeader(doc, order);
        rowY = CONT_HDR_H + TABLE_HDR_H + 10;
      }

      // ── Summary block ──
      const sumTop = rowY + SUMMARY_GAP;

      doc.rect(MX, sumTop, 290, SUMMARY_H).fill(LIGHT).stroke('#D1D5DB');
      doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold')
        .text('Invoice Amount in Words:', 52, sumTop + 12);
      const amtWords = numberToWords(Math.round(order.total)) + ' Rupees Only';
      doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
        .text(amtWords, 52, sumTop + 28, { width: 266, lineGap: 2 });
      doc.fillColor(GRAY).fontSize(9).font('Helvetica')
        .text(`Payment Mode: ${order.paymentMode}`, 52, sumTop + 58);

      doc.rect(345, sumTop, 210, SUMMARY_H).fill(LIGHT).stroke('#D1D5DB');
      doc.fillColor(GRAY).fontSize(9).font('Helvetica')
        .text('Sub Total', 357, sumTop + 12);
      doc.fillColor(DARK).fontSize(9).font('Helvetica')
        .text(`Rs ${order.subtotal.toFixed(2)}`, 345, sumTop + 12, { width: 198, align: 'right' });
      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
        .text('(GST Included)', 357, sumTop + 30);
      doc.rect(345, sumTop + 56, 210, 24).fill(NAVY);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
        .text('TOTAL',                        357,  sumTop + 63)
        .text(`Rs ${order.total.toFixed(2)}`, 345,  sumTop + 63, { width: 198, align: 'right' });

      drawFooter(doc, order);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default generateInvoicePDF;
