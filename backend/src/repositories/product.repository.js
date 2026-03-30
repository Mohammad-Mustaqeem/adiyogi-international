import Product from '../models/product.model.js';

// In-memory TTL cache for countProducts — shared across all requests
// Avoids a full DB scan on every paginated list request
const _countCache = new Map(); // key → { value, expiresAt }
const COUNT_TTL_MS = 30_000;   // 30 seconds

export function findProducts(filter, { page = 1, limit = 12 } = {}) {
  return Product.find(filter)
    .populate('collections', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();
}

export async function countProducts(filter) {
  const key = JSON.stringify(filter);
  const cached = _countCache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.value;
  const value = await Product.countDocuments(filter);
  _countCache.set(key, { value, expiresAt: Date.now() + COUNT_TTL_MS });
  return value;
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

export function decrementStock(id, quantity, options = {}) {
  let q = Product.findByIdAndUpdate(id, { $inc: { stock: -quantity } });
  if (options.session) q = q.session(options.session);
  return q;
}
