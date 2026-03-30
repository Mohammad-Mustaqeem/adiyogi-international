import express from 'express';
import auth from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginSchema, setupSchema, updateOrderStatusSchema } from '../validators/admin.validator.js';
import {
  login,
  setup,
  getDashboard,
  getOrders,
  updateOrderStatus,
} from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/setup', validate(setupSchema), setup);
router.get('/dashboard', auth, getDashboard);
router.get('/orders', auth, getOrders);
router.patch('/orders/:id/status', auth, validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
