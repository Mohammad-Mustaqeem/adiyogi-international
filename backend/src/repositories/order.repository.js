import Order from '../models/order.model.js';

export function create(data, options = {}) {
  const order = new Order(data);
  return order.save({ session: options.session || null });
}

export function findById(id) {
  return Order.findById(id).lean();
}

export function findWithPagination(filter, { page = 1, limit = 20 } = {}) {
  return Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('items.product', 'images')
    .lean();
}

export function countOrders(filter = {}) {
  return Order.countDocuments(filter);
}

export function findRecentOrders(limit = 10) {
  return Order.find().sort({ createdAt: -1 }).limit(limit).lean();
}

export function update(id, data) {
  return Order.findByIdAndUpdate(id, data, { new: true });
}

export function updateStatus(id, status) {
  return Order.findByIdAndUpdate(id, { status }, { new: true });
}

export function getRevenue() {
  return Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
}
