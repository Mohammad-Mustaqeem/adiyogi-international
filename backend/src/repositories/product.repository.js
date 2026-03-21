import Product from '../models/product.model.js';

export function findProducts(filter, { page = 1, limit = 12 } = {}) {
  return Product.find(filter)
    .populate('collections', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();
}

export function countProducts(filter) {
  return Product.countDocuments(filter);
}

export function findById(id) {
  return Product.findById(id).populate('collections', 'name slug');
}

export function findByIds(ids, options = {}) {
  let q = Product.find({ _id: { $in: ids } }).lean();
  if (options.session) q = q.session(options.session);
  return q;
}

export function create(data) {
  const product = new Product(data);
  return product.save();
}

export function update(id, data) {
  return Product.findByIdAndUpdate(id, data, { new: true });
}

export function softDelete(id) {
  return Product.findByIdAndUpdate(id, { isActive: false });
}

export function countActive() {
  return Product.countDocuments({ isActive: true });
}
