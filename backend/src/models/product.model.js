import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  description:      { type: String, default: '' },
  itemCode:         { type: String, required: true, unique: true },
  hsnCode:          { type: String, default: '' },
  salesPrice:       { type: Number, required: true },
  purchasePrice:    { type: Number },
  standardPacking:  { type: String, default: '' },
  // Unit configuration
  baseUnit:           { type: String, default: 'PAC', enum: ['PAC', 'NOS'] },
  secondaryUnit:      { type: String, default: 'NOS', enum: ['NOS', 'None'] },
  unitConversionRate: { type: Number, default: 10 },
  stock:            { type: Number, default: 0 },
  images:           [{ type: String }],  // ImageKit CDN URLs
  imageFileIds:     [{ type: String }],  // ImageKit fileIds (parallel array for deletion)
  collections:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
  place:            { type: String, default: '' },
  isActive:         { type: Boolean, default: true },
  gstRate:          { type: Number, default: 5, enum: [0, 5, 12, 18, 28] },
}, { timestamps: true });

productSchema.index({ name: 'text', itemCode: 'text', description: 'text' });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ collections: 1, isActive: 1 }); // fast collection-filter queries

export default mongoose.model('Product', productSchema);
