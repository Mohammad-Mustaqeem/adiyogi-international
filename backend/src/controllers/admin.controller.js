import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin || !(await admin.comparePassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, name: admin.name, whatsappNumber: admin.whatsappNumber });
});

export const setup = asyncHandler(async (req, res) => {
  const count = await Admin.countDocuments();
  if (count > 0) throw new ApiError(400, 'Admin already exists');
  const admin = new Admin(req.body);
  await admin.save();
  res.status(201).json({ message: 'Admin created successfully' });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    totalProducts,
    recentOrders,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'Pending' }),
    Order.countDocuments({ status: 'Confirmed' }),
    Order.countDocuments({ status: 'Delivered' }),
    Product.countDocuments({ isActive: true }),
    Order.find().sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const revenue = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);

  res.json({
    totalOrders,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    totalProducts,
    totalRevenue: revenue[0]?.total || 0,
    recentOrders,
  });
});

export const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = status ? { status } : {};
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('items.product', 'images')
    .lean();
  const total = await Order.countDocuments(filter);
  res.json({ orders, total, pages: Math.ceil(total / limit) });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true },
  );
  res.json(order);
});
