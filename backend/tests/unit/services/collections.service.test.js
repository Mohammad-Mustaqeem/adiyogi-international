/**
 * Unit tests for: CollectionsService
 * Module path:    src/services/collections.service.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/repositories/collection.repository.js', () => ({
  findActive: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
}));

vi.mock('../../../src/utils/helpers.js', () => ({
  makeSlug: vi.fn((name) => `${name.toLowerCase().replace(/\s+/g, '-')}-1234567890`),
  parseCollections: vi.fn(),
  numberToWords: vi.fn(),
  buildAdminMessage: vi.fn(),
  buildCustomerMessage: vi.fn(),
}));

import * as collectionRepo from '../../../src/repositories/collection.repository.js';
import * as helpers from '../../../src/utils/helpers.js';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../../../src/services/collections.service.js';
import { ApiError } from '../../../src/utils/api-error.js';

describe('collections.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getCollections ─────────────────────────────────────────────────────────
  describe('getCollections', () => {
    it('should delegate to collectionRepo.findActive and return the result', async () => {
      const mockCollections = [{ _id: 'col-1', name: 'New Arrivals' }];
      collectionRepo.findActive.mockResolvedValue(mockCollections);

      const result = await getCollections();

      expect(result).toEqual(mockCollections);
      expect(collectionRepo.findActive).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no collections exist', async () => {
      collectionRepo.findActive.mockResolvedValue([]);

      const result = await getCollections();

      expect(result).toEqual([]);
    });
  });

  // ── createCollection ───────────────────────────────────────────────────────
  describe('createCollection', () => {
    const body = { name: 'Summer Collection', description: 'Hot items', sortOrder: 2 };

    it('should create a collection with a generated slug', async () => {
      collectionRepo.create.mockResolvedValue({ _id: 'col-new', name: 'Summer Collection' });

      await createCollection(body, null);

      expect(helpers.makeSlug).toHaveBeenCalledWith('Summer Collection');
      expect(collectionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: expect.any(String) }),
      );
    });

    it('should trim whitespace from name before saving', async () => {
      collectionRepo.create.mockResolvedValue({});

      await createCollection({ ...body, name: '  Summer Collection  ' }, null);

      expect(collectionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Summer Collection' }),
      );
    });

    it('should set image path when file is provided', async () => {
      collectionRepo.create.mockResolvedValue({});
      const file = { filename: 'summer.jpg' };

      await createCollection(body, file);

      expect(collectionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ image: '/uploads/collections/summer.jpg' }),
      );
    });

    it('should NOT include image key when file is null', async () => {
      collectionRepo.create.mockResolvedValue({});

      await createCollection(body, null);

      const [data] = collectionRepo.create.mock.calls[0];
      expect(data.image).toBeUndefined();
    });

    it('should use empty string for description when not provided', async () => {
      collectionRepo.create.mockResolvedValue({});

      await createCollection({ name: 'Test' }, null);

      expect(collectionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: '' }),
      );
    });

    it('should default sortOrder to 0 when not provided', async () => {
      collectionRepo.create.mockResolvedValue({});

      await createCollection({ name: 'Test' }, null);

      expect(collectionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ sortOrder: 0 }),
      );
    });
  });

  // ── updateCollection ───────────────────────────────────────────────────────
  describe('updateCollection', () => {
    it('should return the updated collection on success', async () => {
      const updated = { _id: 'col-1', name: 'Updated Name' };
      collectionRepo.update.mockResolvedValue(updated);

      const result = await updateCollection('col-1', { name: 'Updated Name' }, null);

      expect(result).toEqual(updated);
    });

    it('should regenerate slug when name is updated', async () => {
      collectionRepo.update.mockResolvedValue({ _id: 'col-1' });

      await updateCollection('col-1', { name: 'New Name' }, null);

      expect(helpers.makeSlug).toHaveBeenCalledWith('New Name');
      expect(collectionRepo.update).toHaveBeenCalledWith(
        'col-1',
        expect.objectContaining({ slug: expect.any(String) }),
      );
    });

    it('should trim whitespace from name before updating', async () => {
      collectionRepo.update.mockResolvedValue({});

      await updateCollection('col-1', { name: '  Trimmed  ' }, null);

      expect(collectionRepo.update).toHaveBeenCalledWith(
        'col-1',
        expect.objectContaining({ name: 'Trimmed' }),
      );
    });

    it('should NOT update name or slug when name is not in the body', async () => {
      collectionRepo.update.mockResolvedValue({});

      await updateCollection('col-1', { description: 'New desc' }, null);

      const [, data] = collectionRepo.update.mock.calls[0];
      expect(data.name).toBeUndefined();
      expect(data.slug).toBeUndefined();
    });

    it('should update image path when file is provided', async () => {
      collectionRepo.update.mockResolvedValue({});
      const file = { filename: 'new-img.jpg' };

      await updateCollection('col-1', {}, file);

      expect(collectionRepo.update).toHaveBeenCalledWith(
        'col-1',
        expect.objectContaining({ image: '/uploads/collections/new-img.jpg' }),
      );
    });

    it('should throw 404 ApiError when collection is not found', async () => {
      collectionRepo.update.mockResolvedValue(null);

      await expect(updateCollection('nonexistent', { name: 'X' }, null)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Collection not found',
      });
    });

    it('should update description when provided', async () => {
      collectionRepo.update.mockResolvedValue({});

      await updateCollection('col-1', { description: 'Updated desc' }, null);

      expect(collectionRepo.update).toHaveBeenCalledWith(
        'col-1',
        expect.objectContaining({ description: 'Updated desc' }),
      );
    });
  });

  // ── deleteCollection ───────────────────────────────────────────────────────
  describe('deleteCollection', () => {
    it('should soft delete and return success message for a normal collection', async () => {
      collectionRepo.findById.mockResolvedValue({ _id: 'col-1', isSystem: false });
      collectionRepo.softDelete.mockResolvedValue(undefined);

      const result = await deleteCollection('col-1');

      expect(collectionRepo.softDelete).toHaveBeenCalledWith('col-1');
      expect(result).toEqual({ message: 'Collection removed' });
    });

    it('should throw 404 ApiError when collection does not exist', async () => {
      collectionRepo.findById.mockResolvedValue(null);

      await expect(deleteCollection('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Collection not found',
      });
    });

    it('should throw 403 ApiError when collection is a system collection', async () => {
      collectionRepo.findById.mockResolvedValue({ _id: 'col-sys', isSystem: true });

      await expect(deleteCollection('col-sys')).rejects.toMatchObject({
        statusCode: 403,
        message: 'System collections cannot be deleted',
      });
    });

    it('should NOT call softDelete for system collections', async () => {
      collectionRepo.findById.mockResolvedValue({ _id: 'col-sys', isSystem: true });

      await expect(deleteCollection('col-sys')).rejects.toThrow();
      expect(collectionRepo.softDelete).not.toHaveBeenCalled();
    });

    it('should NOT call softDelete when collection is not found', async () => {
      collectionRepo.findById.mockResolvedValue(null);

      await expect(deleteCollection('bad-id')).rejects.toThrow();
      expect(collectionRepo.softDelete).not.toHaveBeenCalled();
    });
  });
});
