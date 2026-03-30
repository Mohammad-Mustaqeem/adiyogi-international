import { asyncHandler } from '../utils/async-handler.js';
import * as adminService from '../services/admin.service.js';
import { ApiError } from '../utils/api-error.js';

const VALID_ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await adminService.login(username, password);
  res.json(result);
});

export const setup = asyncHandler(async (req, res) => {
  const result = await adminService.setup(req.body);
  res.status(201).json(result);
});

export const getDashboard = asyncHandler(async (req, res) => {
  const result = await adminService.getDashboard();
  res.json(result);
});

export const getOrders = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const { status } = req.query;
  const result = await adminService.getOrders({ page, limit, status });
  res.json(result);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!VALID_ORDER_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`);
  }
  const order = await adminService.updateOrderStatus(req.params.id, status);
  res.json(order);
});
