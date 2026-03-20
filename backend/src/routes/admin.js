import express from 'express';
import auth from '../middleware/auth.js';
import {
  login,
  setup,
  getDashboard,
  getOrders,
  updateOrderStatus,
} from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/login', login);
router.post('/setup', setup);
router.get('/dashboard', auth, getDashboard);
router.get('/orders', auth, getOrders);
router.patch('/orders/:id/status', auth, updateOrderStatus);

export default router;
