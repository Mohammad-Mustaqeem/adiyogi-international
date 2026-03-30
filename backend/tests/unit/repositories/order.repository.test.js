/**
 * Unit tests for: OrderRepository
 * Module path:    src/repositories/order.repository.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Order model ───────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => {
  const chain = {
    sort: vi.fn(),
    limit: vi.fn(),
    skip: vi.fn(),
    populate: vi.fn(),
    lean: vi.fn(),
  };
  chain.sort.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.skip.mockReturnValue(chain);
  chain.populate.mockReturnValue(chain);

  return {
    save: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    chain,
  };
});

vi.mock('../../../src/models/order.model.js', () => {
  const Order = vi.fn().mockImplementation(() => ({ save: mocks.save }));
  Order.find = mocks.find;
  Order.findById = mocks.findById;
  Order.findByIdAndUpdate = mocks.findByIdAndUpdate;
  Order.countDocuments = mocks.countDocuments;
  Order.aggregate = mocks.aggregate;
  return { default: Order };
});

import Order from '../../../src/models/order.model.js';
import {
  create,
  findById,
  findWithPagination,
  countOrders,
  findRecentOrders,
  updateStatus,
  getRevenue,
} from '../../../src/repositories/order.repository.js';

describe('order.repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-wire chain after clearAllMocks
    mocks.chain.sort.mockReturnValue(mocks.chain);
    mocks.chain.limit.mockReturnValue(mocks.chain);
    mocks.chain.skip.mockReturnValue(mocks.chain);
    mocks.chain.populate.mockReturnValue(mocks.chain);
    mocks.find.mockReturnValue(mocks.chain);
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should construct a new Order and call save() with the session', () => {
      mocks.save.mockResolvedValue({});
      const data = { customer: { name: 'Jane' }, items: [], total: 100 };
      const session = { id: 'sess-001' };

      create(data, { session });

      expect(Order).toHaveBeenCalledWith(data);
      expect(mocks.save).toHaveBeenCalledWith({ session });
    });

    it('should call save() with session: null when no session provided', () => {
      mocks.save.mockResolvedValue({});

      create({ customer: {}, items: [], total: 0 }, {});

      expect(mocks.save).toHaveBeenCalledWith({ session: null });
    });

    it('should return the saved order', async () => {
      const saved = { _id: 'order-001', orderId: 'ADI-0001' };
      mocks.save.mockResolvedValue(saved);

      const result = await create({ customer: {}, items: [], total: 0 });

      expect(result).toEqual(saved);
    });
  });

  // ── findById ───────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should call Order.findById with the given id and lean()', () => {
      mocks.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

      findById('order-001');

      expect(mocks.findById).toHaveBeenCalledWith('order-001');
    });

    it('should return the order as a plain object', async () => {
      const order = { _id: 'order-001', orderId: 'ADI-0001' };
      mocks.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(order) });

      const result = await findById('order-001');

      expect(result).toEqual(order);
    });

    it('should return null when order is not found', async () => {
      mocks.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

      const result = await findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ── findWithPagination ─────────────────────────────────────────────────────
  describe('findWithPagination', () => {
    it('should call Order.find with the given filter', () => {
      mocks.chain.lean.mockResolvedValue([]);
      const filter = { status: 'Pending' };

      findWithPagination(filter, { page: 1, limit: 20 });

      expect(mocks.find).toHaveBeenCalledWith(filter);
    });

    it('should sort by createdAt descending', () => {
      mocks.chain.lean.mockResolvedValue([]);

      findWithPagination({}, { page: 1, limit: 20 });

      expect(mocks.chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should apply limit and skip based on page and limit', () => {
      mocks.chain.lean.mockResolvedValue([]);

      findWithPagination({}, { page: 3, limit: 10 });

      expect(mocks.chain.limit).toHaveBeenCalledWith(10);
      expect(mocks.chain.skip).toHaveBeenCalledWith(20); // (3-1)*10
    });

    it('should populate items.product with images field', () => {
      mocks.chain.lean.mockResolvedValue([]);

      findWithPagination({}, { page: 1, limit: 20 });

      expect(mocks.chain.populate).toHaveBeenCalledWith('items.product', 'images');
    });

    it('should default to page=1 and limit=20', () => {
      mocks.chain.lean.mockResolvedValue([]);

      findWithPagination({});

      expect(mocks.chain.limit).toHaveBeenCalledWith(20);
      expect(mocks.chain.skip).toHaveBeenCalledWith(0);
    });

    it('should return the paginated orders', async () => {
      const orders = [{ orderId: 'ADI-0001' }, { orderId: 'ADI-0002' }];
      mocks.chain.lean.mockResolvedValue(orders);

      const result = await findWithPagination({}, { page: 1, limit: 20 });

      expect(result).toEqual(orders);
    });
  });

  // ── countOrders ────────────────────────────────────────────────────────────
  describe('countOrders', () => {
    it('should call Order.countDocuments with the given filter', () => {
      mocks.countDocuments.mockResolvedValue(5);

      countOrders({ status: 'Pending' });

      expect(mocks.countDocuments).toHaveBeenCalledWith({ status: 'Pending' });
    });

    it('should use an empty filter by default', () => {
      mocks.countDocuments.mockResolvedValue(10);

      countOrders();

      expect(mocks.countDocuments).toHaveBeenCalledWith({});
    });

    it('should return the count', async () => {
      mocks.countDocuments.mockResolvedValue(42);

      const result = await countOrders();

      expect(result).toBe(42);
    });
  });

  // ── findRecentOrders ───────────────────────────────────────────────────────
  describe('findRecentOrders', () => {
    it('should call Order.find with no filter, sorted descending by createdAt', () => {
      mocks.chain.lean.mockResolvedValue([]);

      findRecentOrders(5);

      expect(mocks.find).toHaveBeenCalledWith();
      expect(mocks.chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should limit results to the given count', () => {
      mocks.chain.lean.mockResolvedValue([]);

      findRecentOrders(5);

      expect(mocks.chain.limit).toHaveBeenCalledWith(5);
    });

    it('should default to a limit of 10', () => {
      mocks.chain.lean.mockResolvedValue([]);

      findRecentOrders();

      expect(mocks.chain.limit).toHaveBeenCalledWith(10);
    });

    it('should return lean results', async () => {
      const orders = [{ orderId: 'ADI-0001' }];
      mocks.chain.lean.mockResolvedValue(orders);

      const result = await findRecentOrders(1);

      expect(result).toEqual(orders);
    });
  });

  // ── updateStatus ───────────────────────────────────────────────────────────
  describe('updateStatus', () => {
    it('should call findByIdAndUpdate with id, status, and { new: true }', () => {
      mocks.findByIdAndUpdate.mockResolvedValue({});

      updateStatus('order-001', 'Confirmed');

      expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith(
        'order-001',
        { status: 'Confirmed' },
        { new: true },
      );
    });

    it('should return the updated order', async () => {
      const updated = { _id: 'order-001', status: 'Delivered' };
      mocks.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await updateStatus('order-001', 'Delivered');

      expect(result).toEqual(updated);
    });
  });

  // ── getRevenue ─────────────────────────────────────────────────────────────
  describe('getRevenue', () => {
    it('should call Order.aggregate with the correct pipeline', () => {
      mocks.aggregate.mockResolvedValue([{ total: 50000 }]);

      getRevenue();

      expect(mocks.aggregate).toHaveBeenCalledWith([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]);
    });

    it('should return the aggregation result', async () => {
      mocks.aggregate.mockResolvedValue([{ _id: null, total: 75000 }]);

      const result = await getRevenue();

      expect(result).toEqual([{ _id: null, total: 75000 }]);
    });

    it('should return an empty array when no non-cancelled orders exist', async () => {
      mocks.aggregate.mockResolvedValue([]);

      const result = await getRevenue();

      expect(result).toEqual([]);
    });
  });
});
