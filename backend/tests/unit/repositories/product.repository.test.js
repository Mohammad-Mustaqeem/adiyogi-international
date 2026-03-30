/**
 * Unit tests for: ProductRepository
 * Module path:    src/repositories/product.repository.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Product model ─────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => {
  const chainQuery = {
    populate: vi.fn(),
    sort: vi.fn(),
    limit: vi.fn(),
    skip: vi.fn(),
    lean: vi.fn(),
    session: vi.fn(),
  };
  // Wire up method chaining
  chainQuery.populate.mockReturnValue(chainQuery);
  chainQuery.sort.mockReturnValue(chainQuery);
  chainQuery.limit.mockReturnValue(chainQuery);
  chainQuery.skip.mockReturnValue(chainQuery);
  chainQuery.session.mockReturnValue(chainQuery);

  return {
    save: vi.fn(),
    find: vi.fn().mockReturnValue(chainQuery),
    findById: vi.fn().mockReturnValue(chainQuery),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
    chain: chainQuery,
  };
});

vi.mock('../../../src/models/product.model.js', () => {
  const Product = vi.fn().mockImplementation(() => ({ save: mocks.save }));
  Product.find = mocks.find;
  Product.findById = mocks.findById;
  Product.findByIdAndUpdate = mocks.findByIdAndUpdate;
  Product.countDocuments = mocks.countDocuments;
  return { default: Product };
});

import Product from '../../../src/models/product.model.js';
import {
  findProducts,
  countProducts,
  findById,
  findByIds,
  create,
  update,
  softDelete,
  countActive,
} from '../../../src/repositories/product.repository.js';

describe('product.repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-wire chain after clearAllMocks
    mocks.chain.populate.mockReturnValue(mocks.chain);
    mocks.chain.sort.mockReturnValue(mocks.chain);
    mocks.chain.limit.mockReturnValue(mocks.chain);
    mocks.chain.skip.mockReturnValue(mocks.chain);
    mocks.chain.session.mockReturnValue(mocks.chain);
    mocks.find.mockReturnValue(mocks.chain);
    mocks.findById.mockReturnValue(mocks.chain);
  });

  // ── findProducts ───────────────────────────────────────────────────────────
  describe('findProducts', () => {
    it('should call Product.find with the given filter', () => {
      mocks.chain.lean.mockResolvedValue([]);
      const filter = { isActive: true };

      findProducts(filter, { page: 1, limit: 12 });

      expect(mocks.find).toHaveBeenCalledWith(filter);
    });

    it('should apply populate, sort, limit, skip, and lean in sequence', () => {
      mocks.chain.lean.mockResolvedValue([]);

      findProducts({ isActive: true }, { page: 2, limit: 6 });

      expect(mocks.chain.populate).toHaveBeenCalledWith('collections', 'name slug');
      expect(mocks.chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mocks.chain.limit).toHaveBeenCalledWith(6);
      expect(mocks.chain.skip).toHaveBeenCalledWith(6); // (2-1)*6
      expect(mocks.chain.lean).toHaveBeenCalled();
    });

    it('should default to page=1, limit=12 when no pagination provided', () => {
      mocks.chain.lean.mockResolvedValue([]);

      findProducts({ isActive: true });

      expect(mocks.chain.limit).toHaveBeenCalledWith(12);
      expect(mocks.chain.skip).toHaveBeenCalledWith(0); // (1-1)*12
    });

    it('should return the queried products', async () => {
      const products = [{ name: 'Product 1' }];
      mocks.chain.lean.mockResolvedValue(products);

      const result = await findProducts({}, { page: 1, limit: 12 });

      expect(result).toEqual(products);
    });
  });

  // ── countProducts ──────────────────────────────────────────────────────────
  describe('countProducts', () => {
    it('should call Product.countDocuments with the given filter', () => {
      mocks.countDocuments.mockResolvedValue(5);
      const filter = { isActive: true, collections: 'col-id' };

      countProducts(filter);

      expect(mocks.countDocuments).toHaveBeenCalledWith(filter);
    });

    it('should return the count', async () => {
      mocks.countDocuments.mockResolvedValue(42);

      const result = await countProducts({});

      expect(result).toBe(42);
    });
  });

  // ── findById ───────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should call Product.findById with the given id', () => {
      mocks.chain.populate.mockResolvedValue({ _id: 'prod-001' });

      findById('prod-001');

      expect(mocks.findById).toHaveBeenCalledWith('prod-001');
    });

    it('should populate collections with name and slug', () => {
      mocks.chain.populate.mockResolvedValue(null);

      findById('prod-001');

      expect(mocks.chain.populate).toHaveBeenCalledWith('collections', 'name slug');
    });

    it('should return the product', async () => {
      const product = { _id: 'prod-001', name: 'Kurta' };
      mocks.chain.populate.mockResolvedValue(product);

      const result = await findById('prod-001');

      expect(result).toEqual(product);
    });
  });

  // ── findByIds ──────────────────────────────────────────────────────────────
  describe('findByIds', () => {
    it('should call Product.find with $in filter', () => {
      mocks.chain.lean.mockResolvedValue([]);

      findByIds(['id-1', 'id-2']);

      expect(mocks.find).toHaveBeenCalledWith({ _id: { $in: ['id-1', 'id-2'] } });
    });

    it('should chain .lean() on the query', () => {
      mocks.chain.lean.mockResolvedValue([]);

      findByIds(['id-1']);

      expect(mocks.chain.lean).toHaveBeenCalled();
    });

    it('should chain .session() when a session is provided', () => {
      const session = { id: 'session-001' };
      mocks.chain.lean.mockReturnValue(mocks.chain);
      mocks.chain.session.mockResolvedValue([]);

      findByIds(['id-1'], { session });

      expect(mocks.chain.session).toHaveBeenCalledWith(session);
    });

    it('should NOT chain .session() when no session is provided', async () => {
      mocks.chain.lean.mockResolvedValue([]);

      await findByIds(['id-1'], {});

      expect(mocks.chain.session).not.toHaveBeenCalled();
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should construct a new Product and call save()', () => {
      mocks.save.mockResolvedValue({});
      const data = { name: 'Kurta', itemCode: 'K-001', salesPrice: 200 };

      create(data);

      expect(Product).toHaveBeenCalledWith(data);
      expect(mocks.save).toHaveBeenCalledTimes(1);
    });

    it('should return the saved product', async () => {
      const saved = { _id: 'new-id', name: 'Kurta' };
      mocks.save.mockResolvedValue(saved);

      const result = await create({ name: 'Kurta', itemCode: 'K-001', salesPrice: 200 });

      expect(result).toEqual(saved);
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should call Product.findByIdAndUpdate with id, data, and { new: true }', () => {
      const updated = { _id: 'prod-001', name: 'Updated Kurta' };
      mocks.findByIdAndUpdate.mockResolvedValue(updated);

      update('prod-001', { name: 'Updated Kurta' });

      expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith(
        'prod-001',
        { name: 'Updated Kurta' },
        { new: true },
      );
    });

    it('should return the updated product', async () => {
      const updated = { _id: 'prod-001', name: 'Updated' };
      mocks.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await update('prod-001', { name: 'Updated' });

      expect(result).toEqual(updated);
    });
  });

  // ── softDelete ─────────────────────────────────────────────────────────────
  describe('softDelete', () => {
    it('should set isActive to false via findByIdAndUpdate', () => {
      mocks.findByIdAndUpdate.mockResolvedValue({});

      softDelete('prod-001');

      expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith('prod-001', { isActive: false });
    });
  });

  // ── countActive ────────────────────────────────────────────────────────────
  describe('countActive', () => {
    it('should call countDocuments with { isActive: true }', () => {
      mocks.countDocuments.mockResolvedValue(10);

      countActive();

      expect(mocks.countDocuments).toHaveBeenCalledWith({ isActive: true });
    });

    it('should return the active product count', async () => {
      mocks.countDocuments.mockResolvedValue(7);

      const result = await countActive();

      expect(result).toBe(7);
    });
  });
});
