import express from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { createOrderSchema } from '../validators/orders.validator.js';
import {
  createOrder,
  getOrderInvoice,
  getOrderById,
} from '../controllers/orders.controller.js';

const router = express.Router();

router.post('/', validate(createOrderSchema), createOrder);
router.get('/:id/invoice', getOrderInvoice);
router.get('/:id', getOrderById);

export default router;
