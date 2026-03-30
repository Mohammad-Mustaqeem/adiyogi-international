/**
 * Unit tests for: CollectionRepository
 * Module path:    src/repositories/collection.repository.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Collection model ──────────────────────────────────────────────────────
const mocks = vi.hoisted(() => {
  const chain = {
    sort: vi.fn(),
    findOne: vi.fn(),
  };
  chain.sort.mockReturnValue(chain);
  return {
    save: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOne: vi.fn(),
    chain,
  };
});

vi.mock('../../../src/models/collection.model.js', () => {
  const Collection = vi.fn().mockImplementation(() => ({ save: mocks.save }));
  Collection.find = mocks.find;
  Collection.findById = mocks.findById;
  Collection.findByIdAndUpdate = mocks.findByIdAndUpdate;
  Collection.findOne = mocks.findOne;
  return { default: Collection };
});

import Collection from '../../../src/models/collection.model.js';
import {
  findActive,
  findById,
  create,
  update,
  softDelete,
  findBySlug,
} from '../../../src/repositories/collection.repository.js';

describe('collection.repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.chain.sort.mockReturnValue(mocks.chain);
    mocks.find.mockReturnValue(mocks.chain);
  });

  // ── findActive ─────────────────────────────────────────────────────────────
  describe('findActive', () => {
    it('should call Collection.find with { isActive: true }', () => {
      mocks.chain.sort.mockResolvedValue([]);

      findActive();

      expect(mocks.find).toHaveBeenCalledWith({ isActive: true });
    });

    it('should sort by sortOrder ascending then name ascending', () => {
      mocks.chain.sort.mockResolvedValue([]);

      findActive();

      expect(mocks.chain.sort).toHaveBeenCalledWith({ sortOrder: 1, name: 1 });
    });

    it('should return the active collections', async () => {
      const collections = [{ name: 'New Arrivals' }, { name: 'Summer' }];
      mocks.chain.sort.mockResolvedValue(collections);

      const result = await findActive();

      expect(result).toEqual(collections);
    });
  });

  // ── findById ───────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should call Collection.findById with the given id', () => {
      mocks.findById.mockResolvedValue({ _id: 'col-1' });

      findById('col-1');

      expect(mocks.findById).toHaveBeenCalledWith('col-1');
    });

    it('should return the collection when found', async () => {
      const col = { _id: 'col-1', name: 'Summer' };
      mocks.findById.mockResolvedValue(col);

      const result = await findById('col-1');

      expect(result).toEqual(col);
    });

    it('should return null when collection is not found', async () => {
      mocks.findById.mockResolvedValue(null);

      const result = await findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should construct a new Collection with the provided data', () => {
      mocks.save.mockResolvedValue({});
      const data = { name: 'Summer', slug: 'summer-123', sortOrder: 1 };

      create(data);

      expect(Collection).toHaveBeenCalledWith(data);
    });

    it('should call save() on the new collection instance', () => {
      mocks.save.mockResolvedValue({});

      create({ name: 'Test', slug: 'test-123' });

      expect(mocks.save).toHaveBeenCalledTimes(1);
    });

    it('should return the saved collection', async () => {
      const saved = { _id: 'col-new', name: 'Summer' };
      mocks.save.mockResolvedValue(saved);

      const result = await create({ name: 'Summer', slug: 'summer-123' });

      expect(result).toEqual(saved);
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should call findByIdAndUpdate with id, data, and { new: true }', () => {
      mocks.findByIdAndUpdate.mockResolvedValue({});

      update('col-1', { name: 'Updated' });

      expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith('col-1', { name: 'Updated' }, { new: true });
    });

    it('should return the updated collection', async () => {
      const updated = { _id: 'col-1', name: 'Updated' };
      mocks.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await update('col-1', { name: 'Updated' });

      expect(result).toEqual(updated);
    });

    it('should return null when collection is not found', async () => {
      mocks.findByIdAndUpdate.mockResolvedValue(null);

      const result = await update('bad-id', { name: 'X' });

      expect(result).toBeNull();
    });
  });

  // ── softDelete ─────────────────────────────────────────────────────────────
  describe('softDelete', () => {
    it('should set isActive to false via findByIdAndUpdate', () => {
      mocks.findByIdAndUpdate.mockResolvedValue({});

      softDelete('col-1');

      expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith('col-1', { isActive: false });
    });
  });

  // ── findBySlug ─────────────────────────────────────────────────────────────
  describe('findBySlug', () => {
    it('should call Collection.findOne with the given slug', () => {
      mocks.findOne.mockResolvedValue(null);

      findBySlug('summer-123');

      expect(mocks.findOne).toHaveBeenCalledWith({ slug: 'summer-123' });
    });

    it('should return the matching collection', async () => {
      const col = { _id: 'col-1', slug: 'summer-123' };
      mocks.findOne.mockResolvedValue(col);

      const result = await findBySlug('summer-123');

      expect(result).toEqual(col);
    });

    it('should return null when no collection matches the slug', async () => {
      mocks.findOne.mockResolvedValue(null);

      const result = await findBySlug('nonexistent-slug');

      expect(result).toBeNull();
    });
  });
});
