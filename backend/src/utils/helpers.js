// ── Number to Indian-format words ──
export function numberToWords(num) {
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

// ── WhatsApp message builders ──
export function buildAdminMessage(order) {
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

export function buildCustomerMessage(order) {
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

// ── Slug generator ──
export function makeSlug(name) {
  const base = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${base}-${Date.now()}`;
}

// ── Parse collections from form data ──
export function parseCollections(body) {
  const raw = body.collections;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  try { return JSON.parse(raw).filter(Boolean); } catch { return [raw].filter(Boolean); }
}
