import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, unique: true },
  description: { type: String, default: '' },
  image:       { type: String },
  sortOrder:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  isSystem:    { type: Boolean, default: false }, // system collections cannot be deleted
}, { timestamps: true });

export default mongoose.model('Collection', collectionSchema);
