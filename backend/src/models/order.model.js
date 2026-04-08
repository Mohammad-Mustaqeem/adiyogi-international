import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product:            { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:               String,
  itemCode:           String,
  hsnCode:            String,
  place:              String,
  unit:               String,
  unitConversionRate: { type: Number, default: 10 },
  quantity:           { type: Number, required: true },
  price:              { type: Number, required: true },
  amount:             { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  customer: {
    name:     { type: String, required: true },
    phone:    { type: String },
    whatsapp: { type: String },
    email:    { type: String },
    address:  { type: String, required: true },
    city:     { type: String, required: true },
    state:    { type: String, required: true },
    pincode:  { type: String, required: true },
  },
  items:       [orderItemSchema],
  subtotal:    { type: Number, required: true },
  gstTotal:    { type: Number, default: 0 },
  total:       { type: Number, required: true },
  paymentMode: { type: String, default: 'Credit', enum: ['Credit', 'Cash', 'Online', 'UPI'] },
  status:      { type: String, default: 'Pending', enum: ['Pending','Confirmed','Shipped','Delivered','Cancelled'] },
  notes:          { type: String, default: '', maxlength: 500 },
  whatsappSent:   { type: Boolean, default: false },
  invoiceUrl:     { type: String, default: null },  // ImageKit CDN URL
  invoiceFileId:  { type: String, default: null },  // ImageKit fileId for deletion
}, { timestamps: true });

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    // Use findOneAndUpdate on a counter doc for atomic, race-condition-safe ID generation
    const counter = await mongoose.connection.db
      .collection('counters')
      .findOneAndUpdate(
        { _id: 'orderId' },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' },
      );
    const seq = counter.seq ?? counter.value?.seq ?? 1;
    this.orderId = `ADI-${String(seq).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);
