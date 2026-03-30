/**
 * Unit tests for: AdminController
 * Module path:    src/controllers/admin.controller.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/services/admin.service.js', () => ({
  login: vi.fn(),
  setup: vi.fn(),
  getDashboard: vi.fn(),
  getOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

import * as adminService from '../../../src/services/admin.service.js';
import {
  login,
  setup,
  getDashboard,
  getOrders,
  updateOrderStatus,
} from '../../../src/controllers/admin.controller.js';
import { ApiError } from '../../../src/utils/api-error.js';

// ── Helpers ────────────────────────────────────────────────────────────────────
const mockReq = (overrides = {}) => ({ body: {}, params: {}, query: {}, ...overrides });

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// asyncHandler does not return the inner Promise, so we must flush the microtask
// queue to let the .catch(next) callback run before making assertions.
const flushPromises = () => new Promise((r) => setTimeout(r, 0));

describe('admin.controller', () => {
  let res, next;

  beforeEach(() => {
    res = mockRes();
    next = vi.fn();
    vi.clearAllMocks();
  });

  // ── login ──────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('should return 200 with token and admin info on successful login', async () => {
      const serviceResult = { token: 'jwt-token', name: 'Admin', whatsappNumber: '91999' };
      adminService.login.mockResolvedValue(serviceResult);

      login(mockReq({ body: { username: 'admin', password: 'pass' } }), res, next);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith(serviceResult);
    });

    it('should pass username and password from req.body to the service', async () => {
      adminService.login.mockResolvedValue({});

      login(mockReq({ body: { username: 'myadmin', password: 'mypass' } }), res, next);
      await flushPromises();

      expect(adminService.login).toHaveBeenCalledWith('myadmin', 'mypass');
    });

    it('should call next with error when service throws', async () => {
      const error = new ApiError(401, 'Invalid credentials');
      adminService.login.mockRejectedValue(error);

      login(mockReq(), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ── setup ──────────────────────────────────────────────────────────────────
  describe('setup', () => {
    it('should return 201 with success message on first-time setup', async () => {
      adminService.setup.mockResolvedValue({ message: 'Admin created successfully' });

      setup(mockReq({ body: { username: 'admin', password: 'pass123' } }), res, next);
      await flushPromises();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admin created successfully' });
    });

    it('should pass the entire req.body to the service', async () => {
      const body = { username: 'admin', password: 'pass', whatsappNumber: '91999', name: 'Boss' };
      adminService.setup.mockResolvedValue({});

      setup(mockReq({ body }), res, next);
      await flushPromises();

      expect(adminService.setup).toHaveBeenCalledWith(body);
    });

    it('should call next with error when service throws', async () => {
      const error = new ApiError(400, 'Admin already exists');
      adminService.setup.mockRejectedValue(error);

      setup(mockReq(), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ── getDashboard ───────────────────────────────────────────────────────────
  describe('getDashboard', () => {
    it('should return dashboard stats as JSON', async () => {
      const stats = { totalOrders: 10, totalRevenue: 5000, totalProducts: 20 };
      adminService.getDashboard.mockResolvedValue(stats);

      getDashboard(mockReq(), res, next);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith(stats);
    });

    it('should call next with error when service throws', async () => {
      adminService.getDashboard.mockRejectedValue(new Error('DB error'));

      getDashboard(mockReq(), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── getOrders ──────────────────────────────────────────────────────────────
  describe('getOrders', () => {
    it('should pass page, limit, and status from query to the service', async () => {
      adminService.getOrders.mockResolvedValue({ orders: [], total: 0, pages: 0 });

      getOrders(mockReq({ query: { page: '2', limit: '10', status: 'Pending' } }), res, next);
      await flushPromises();

      expect(adminService.getOrders).toHaveBeenCalledWith({ page: '2', limit: '10', status: 'Pending' });
    });

    it('should return the orders result as JSON', async () => {
      const result = { orders: [{ orderId: 'ADI-0001' }], total: 1, pages: 1 };
      adminService.getOrders.mockResolvedValue(result);

      getOrders(mockReq({ query: {} }), res, next);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith(result);
    });
  });

  // ── updateOrderStatus ──────────────────────────────────────────────────────
  describe('updateOrderStatus', () => {
    it('should pass order id and status to the service', async () => {
      adminService.updateOrderStatus.mockResolvedValue({ orderId: 'ADI-0001', status: 'Confirmed' });

      updateOrderStatus(
        mockReq({ params: { id: 'ADI-0001' }, body: { status: 'Confirmed' } }),
        res,
        next,
      );
      await flushPromises();

      expect(adminService.updateOrderStatus).toHaveBeenCalledWith('ADI-0001', 'Confirmed');
    });

    it('should return the updated order as JSON', async () => {
      const updated = { orderId: 'ADI-0001', status: 'Delivered' };
      adminService.updateOrderStatus.mockResolvedValue(updated);

      updateOrderStatus(
        mockReq({ params: { id: 'ADI-0001' }, body: { status: 'Delivered' } }),
        res,
        next,
      );
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('should call next with error when service throws', async () => {
      adminService.updateOrderStatus.mockRejectedValue(new Error('Not found'));

      updateOrderStatus(mockReq({ params: { id: 'bad-id' }, body: { status: 'Confirmed' } }), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
