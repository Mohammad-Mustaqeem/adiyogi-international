import express from 'express';
import {
  createOrder,
  getOrderInvoice,
  getOrderById,
} from '../controllers/orders.controller.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/:id/invoice', getOrderInvoice);
router.get('/:id', getOrderById);

export default router;
