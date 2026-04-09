import express from 'express';
import auth from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  loginSchema,
  setupSchema,
  updateOrderStatusSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/admin.validator.js';
import {
  login,
  setup,
  getDashboard,
  getOrders,
  updateOrderStatus,
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/setup', validate(setupSchema), setup);
router.get('/dashboard', auth, getDashboard);
router.get('/orders', auth, getOrders);
router.patch('/orders/:id/status', auth, validate(updateOrderStatusSchema), updateOrderStatus);
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, validate(updateProfileSchema), updateProfile);
router.patch('/password', auth, validate(changePasswordSchema), changePassword);

export default router;
