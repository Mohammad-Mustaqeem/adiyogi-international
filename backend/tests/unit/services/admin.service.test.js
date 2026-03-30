/**
 * Unit tests for: AdminService
 * Module path:    src/services/admin.service.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/config/env.js', () => ({
  env: { JWT_SECRET: 'test-jwt-secret' },
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn().mockReturnValue('mocked-jwt-token') },
}));

vi.mock('../../../src/repositories/admin.repository.js', () => ({
  findByUsername: vi.fn(),
  countAdmins: vi.fn(),
  createAdmin: vi.fn(),
  findOneAdmin: vi.fn(),
}));

vi.mock('../../../src/repositories/order.repository.js', () => ({
  countOrders: vi.fn(),
  findRecentOrders: vi.fn(),
  getRevenue: vi.fn(),
  findWithPagination: vi.fn(),
  updateStatus: vi.fn(),
}));

vi.mock('../../../src/repositories/product.repository.js', () => ({
  countActive: vi.fn(),
}));

import * as adminRepo from '../../../src/repositories/admin.repository.js';
import * as orderRepo from '../../../src/repositories/order.repository.js';
import * as productRepo from '../../../src/repositories/product.repository.js';
import { login, setup, getDashboard, getOrders, updateOrderStatus } from '../../../src/services/admin.service.js';
import { ApiError } from '../../../src/utils/api-error.js';

describe('admin.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── login ──────────────────────────────────────────────────────────────────
  describe('login', () => {
    const mockAdmin = {
      _id: 'admin-id-001',
      name: 'Test Admin',
      whatsappNumber: '919999999999',
      comparePassword: vi.fn(),
    };

    it('should return token and admin info when credentials are valid', async () => {
      adminRepo.findByUsername.mockResolvedValue(mockAdmin);
      mockAdmin.comparePassword.mockResolvedValue(true);

      const result = await login('admin', 'correctpass');

      expect(result.token).toBe('mocked-jwt-token');
      expect(result.name).toBe('Test Admin');
      expect(result.whatsappNumber).toBe('919999999999');
    });

    it('should throw 401 ApiError when admin user does not exist', async () => {
      adminRepo.findByUsername.mockResolvedValue(null);

      await expect(login('nobody', 'pass')).rejects.toThrow(ApiError);
      await expect(login('nobody', 'pass')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    });

    it('should throw 401 ApiError when password does not match', async () => {
      adminRepo.findByUsername.mockResolvedValue(mockAdmin);
      mockAdmin.comparePassword.mockResolvedValue(false);

      await expect(login('admin', 'wrongpass')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    });

    it('should call findByUsername with the provided username', async () => {
      adminRepo.findByUsername.mockResolvedValue(mockAdmin);
      mockAdmin.comparePassword.mockResolvedValue(true);

      await login('myadmin', 'pass');

      expect(adminRepo.findByUsername).toHaveBeenCalledWith('myadmin');
    });

    it('should propagate errors from the repository', async () => {
      adminRepo.findByUsername.mockRejectedValue(new Error('DB error'));

      await expect(login('admin', 'pass')).rejects.toThrow('DB error');
    });
  });

  // ── setup ──────────────────────────────────────────────────────────────────
  describe('setup', () => {
    it('should create admin and return success message when no admin exists', async () => {
      adminRepo.countAdmins.mockResolvedValue(0);
      adminRepo.createAdmin.mockResolvedValue({ _id: 'new-admin' });

      const result = await setup({ username: 'admin', password: 'pass123' });

      expect(result).toEqual({ message: 'Admin created successfully' });
      expect(adminRepo.createAdmin).toHaveBeenCalledWith({ username: 'admin', password: 'pass123' });
    });

    it('should throw 400 ApiError when admin already exists', async () => {
      adminRepo.countAdmins.mockResolvedValue(1);

      await expect(setup({ username: 'admin', password: 'pass123' })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Admin already exists',
      });
    });

    it('should NOT call createAdmin when admin already exists', async () => {
      adminRepo.countAdmins.mockResolvedValue(1);

      await expect(setup({})).rejects.toThrow();
      expect(adminRepo.createAdmin).not.toHaveBeenCalled();
    });
  });

  // ── getDashboard ───────────────────────────────────────────────────────────
  describe('getDashboard', () => {
    beforeEach(() => {
      orderRepo.countOrders.mockResolvedValue(10);
      orderRepo.findRecentOrders.mockResolvedValue([{ orderId: 'ADI-0001' }]);
      orderRepo.getRevenue.mockResolvedValue([{ total: 50000 }]);
      productRepo.countActive.mockResolvedValue(25);
    });

    it('should return aggregated dashboard stats', async () => {
      const result = await getDashboard();

      expect(result).toMatchObject({
        totalOrders: 10,
        totalProducts: 25,
        totalRevenue: 50000,
      });
    });

    it('should return 0 for totalRevenue when revenue aggregation returns empty array', async () => {
      orderRepo.getRevenue.mockResolvedValue([]);

      const result = await getDashboard();

      expect(result.totalRevenue).toBe(0);
    });

    it('should include recentOrders in the response', async () => {
      const result = await getDashboard();

      expect(result.recentOrders).toEqual([{ orderId: 'ADI-0001' }]);
    });

    it('should query for Pending, Confirmed, and Delivered orders separately', async () => {
      await getDashboard();

      expect(orderRepo.countOrders).toHaveBeenCalledWith({ status: 'Pending' });
      expect(orderRepo.countOrders).toHaveBeenCalledWith({ status: 'Confirmed' });
      expect(orderRepo.countOrders).toHaveBeenCalledWith({ status: 'Delivered' });
    });

    it('should request the 10 most recent orders', async () => {
      await getDashboard();

      expect(orderRepo.findRecentOrders).toHaveBeenCalledWith(10);
    });
  });

  // ── getOrders ──────────────────────────────────────────────────────────────
  describe('getOrders', () => {
    beforeEach(() => {
      orderRepo.findWithPagination.mockResolvedValue([]);
      orderRepo.countOrders.mockResolvedValue(0);
    });

    it('should return orders, total, and pages', async () => {
      orderRepo.findWithPagination.mockResolvedValue([{ orderId: 'ADI-0001' }]);
      orderRepo.countOrders.mockResolvedValue(1);

      const result = await getOrders({ page: 1, limit: 20 });

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.pages).toBe(1);
    });

    it('should apply status filter when status is provided', async () => {
      await getOrders({ status: 'Pending' });

      expect(orderRepo.findWithPagination).toHaveBeenCalledWith(
        { status: 'Pending' },
        expect.objectContaining({ page: 1, limit: 20 }),
      );
    });

    it('should use an empty filter when status is not provided', async () => {
      await getOrders({});

      expect(orderRepo.findWithPagination).toHaveBeenCalledWith(
        {},
        expect.any(Object),
      );
    });

    it('should calculate correct pages count', async () => {
      orderRepo.countOrders.mockResolvedValue(45);

      const result = await getOrders({ page: 1, limit: 20 });

      expect(result.pages).toBe(3); // ceil(45/20)
    });

    it('should default to page=1, limit=20 when no options given', async () => {
      await getOrders();

      expect(orderRepo.findWithPagination).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 20 },
      );
    });
  });

  // ── updateOrderStatus ──────────────────────────────────────────────────────
  describe('updateOrderStatus', () => {
    it('should delegate to orderRepo.updateStatus and return the result', async () => {
      const updated = { orderId: 'ADI-0001', status: 'Confirmed' };
      orderRepo.updateStatus.mockResolvedValue(updated);

      const result = await updateOrderStatus('ADI-0001', 'Confirmed');

      expect(result).toEqual(updated);
      expect(orderRepo.updateStatus).toHaveBeenCalledWith('ADI-0001', 'Confirmed');
    });

    it('should propagate errors from the repository', async () => {
      orderRepo.updateStatus.mockRejectedValue(new Error('DB error'));

      await expect(updateOrderStatus('ADI-0001', 'Confirmed')).rejects.toThrow('DB error');
    });
  });
});
