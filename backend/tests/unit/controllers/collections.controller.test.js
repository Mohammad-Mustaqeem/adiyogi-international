/**
 * Unit tests for: CollectionsController
 * Module path:    src/controllers/collections.controller.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/services/collections.service.js', () => ({
  getCollections: vi.fn(),
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
}));

import * as collectionsService from '../../../src/services/collections.service.js';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../../../src/controllers/collections.controller.js';
import { ApiError } from '../../../src/utils/api-error.js';

// ── Helpers ────────────────────────────────────────────────────────────────────
const mockReq = (overrides = {}) => ({ body: {}, params: {}, file: null, ...overrides });

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// asyncHandler does not return the inner Promise; flush microtasks before asserting.
const flushPromises = () => new Promise((r) => setTimeout(r, 0));

describe('collections.controller', () => {
  let res, next;

  beforeEach(() => {
    res = mockRes();
    next = vi.fn();
    vi.clearAllMocks();
  });

  // ── getCollections ─────────────────────────────────────────────────────────
  describe('getCollections', () => {
    it('should return all collections as JSON', async () => {
      const collections = [{ name: 'New Arrivals' }, { name: 'Summer' }];
      collectionsService.getCollections.mockResolvedValue(collections);

      getCollections(mockReq(), res, next);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith(collections);
    });

    it('should call next with error when service throws', async () => {
      collectionsService.getCollections.mockRejectedValue(new Error('DB error'));

      getCollections(mockReq(), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── createCollection ───────────────────────────────────────────────────────
  describe('createCollection', () => {
    it('should return 201 with the created collection', async () => {
      const created = { _id: 'col-new', name: 'Summer' };
      collectionsService.createCollection.mockResolvedValue(created);

      createCollection(mockReq({ body: { name: 'Summer' }, file: { filename: 'img.jpg' } }), res, next);
      await flushPromises();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
    });

    it('should pass req.body and req.file to the service', async () => {
      const body = { name: 'Summer', description: 'Hot items' };
      const file = { filename: 'summer.jpg' };
      collectionsService.createCollection.mockResolvedValue({});

      createCollection(mockReq({ body, file }), res, next);
      await flushPromises();

      expect(collectionsService.createCollection).toHaveBeenCalledWith(body, file);
    });

    it('should pass null as file when no file is uploaded', async () => {
      collectionsService.createCollection.mockResolvedValue({});

      createCollection(mockReq({ body: { name: 'Test' }, file: null }), res, next);
      await flushPromises();

      expect(collectionsService.createCollection).toHaveBeenCalledWith({ name: 'Test' }, null);
    });

    it('should call next with error when service throws', async () => {
      collectionsService.createCollection.mockRejectedValue(new Error('DB error'));

      createCollection(mockReq(), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── updateCollection ───────────────────────────────────────────────────────
  describe('updateCollection', () => {
    it('should pass params.id, body, and file to the service', async () => {
      collectionsService.updateCollection.mockResolvedValue({ _id: 'col-1', name: 'Updated' });

      updateCollection(
        mockReq({ params: { id: 'col-1' }, body: { name: 'Updated' }, file: { filename: 'new.jpg' } }),
        res,
        next,
      );
      await flushPromises();

      expect(collectionsService.updateCollection).toHaveBeenCalledWith(
        'col-1',
        { name: 'Updated' },
        { filename: 'new.jpg' },
      );
    });

    it('should return the updated collection as JSON', async () => {
      const updated = { _id: 'col-1', name: 'Updated' };
      collectionsService.updateCollection.mockResolvedValue(updated);

      updateCollection(mockReq({ params: { id: 'col-1' } }), res, next);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('should call next with 404 ApiError when collection is not found', async () => {
      collectionsService.updateCollection.mockRejectedValue(new ApiError(404, 'Collection not found'));

      updateCollection(mockReq({ params: { id: 'bad-id' } }), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ── deleteCollection ───────────────────────────────────────────────────────
  describe('deleteCollection', () => {
    it('should pass params.id to the service and return success message', async () => {
      collectionsService.deleteCollection.mockResolvedValue({ message: 'Collection removed' });

      deleteCollection(mockReq({ params: { id: 'col-1' } }), res, next);
      await flushPromises();

      expect(collectionsService.deleteCollection).toHaveBeenCalledWith('col-1');
      expect(res.json).toHaveBeenCalledWith({ message: 'Collection removed' });
    });

    it('should call next with 403 ApiError for system collection deletion attempt', async () => {
      collectionsService.deleteCollection.mockRejectedValue(
        new ApiError(403, 'System collections cannot be deleted'),
      );

      deleteCollection(mockReq({ params: { id: 'col-sys' } }), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('should call next with 404 ApiError when collection does not exist', async () => {
      collectionsService.deleteCollection.mockRejectedValue(new ApiError(404, 'Collection not found'));

      deleteCollection(mockReq({ params: { id: 'bad-id' } }), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
