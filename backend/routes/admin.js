import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, name: admin.name, whatsappNumber: admin.whatsappNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Setup admin (one-time)
router.post('/setup', async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) return res.status(400).json({ message: 'Admin already exists' });
    const admin = new Admin(req.body);
    await admin.save();
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [totalOrders, pendingOrders, confirmedOrders, deliveredOrders, totalProducts, recentOrders] = await Promise.all([
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
      totalOrders, pendingOrders, confirmedOrders, deliveredOrders,
      totalProducts, totalRevenue: revenue[0]?.total || 0, recentOrders,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order status
router.patch('/orders/:id/status', auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all orders
router.get('/orders', auth, async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
