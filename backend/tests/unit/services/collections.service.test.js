/**
 * Unit tests for: CollectionsService
 * Module path:    src/services/collections.service.js
 * Created:        2026-03-22
 * Updated:        2026-03-24 — CDN ImageKit migration (images stored as CDN URLs + fileIds)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/repositories/collection.repository.js', () => ({
  findActive:  vi.fn(),
  findById:    vi.fn(),
  create:      vi.fn(),
  update:      vi.fn(),
  softDelete:  vi.fn(),
}));

vi.mock('../../../src/utils/helpers.js', () => ({
  makeSlug:            vi.fn((name) => `${name.toLowerCase().replace(/\s+/g, '-')}-slug`),
  parseCollections:    vi.fn(),
  numberToWords:       vi.fn(),
  buildAdminMessage:   vi.fn(),
  buildCustomerMessage: vi.fn(),
}));

vi.mock('../../../src/services/imagekit.service.js', () => ({
  uploadCollectionImage: vi.fn(),
  deleteFile:            vi.fn().mockResolvedValue(undefined),
}));

import * as collectionRepo from '../../../src/repositories/collection.repository.js';
import * as helpers from '../../../src/utils/helpers.js';
import * as imagekitService from '../../../src/services/imagekit.service.js';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../../../src/services/collections.service.js';

const CDN_BASE = 'https://ik.imagekit.io/test/adiyogi/collection-images';

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

    it('should upload the image to ImageKit and store CDN URL and fileId when file is provided', async () => {
      const file = { buffer: Buffer.from('cover-img'), originalname: 'summer.jpg' };
      imagekitService.uploadCollectionImage.mockResolvedValue({
        url:    `${CDN_BASE}/collection-uuid.jpg`,
        fileId: 'col-fid-001',
      });
      collectionRepo.create.mockResolvedValue({});

      await createCollection(body, file);

      expect(imagekitService.uploadCollectionImage).toHaveBeenCalledWith(file.buffer, file.originalname);
      expect(collectionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          image:       `${CDN_BASE}/collection-uuid.jpg`,
          imageFileId: 'col-fid-001',
        }),
      );
    });

    it('should NOT include image or imageFileId when file is null', async () => {
      collectionRepo.create.mockResolvedValue({});

      await createCollection(body, null);

      const [data] = collectionRepo.create.mock.calls[0];
      expect(data.image).toBeUndefined();
      expect(data.imageFileId).toBeUndefined();
      expect(imagekitService.uploadCollectionImage).not.toHaveBeenCalled();
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

    it('should propagate errors from imagekitService.uploadCollectionImage', async () => {
      imagekitService.uploadCollectionImage.mockRejectedValue(new Error('CDN error'));
      const file = { buffer: Buffer.from('img'), originalname: 'img.jpg' };

      await expect(createCollection(body, file)).rejects.toThrow('CDN error');
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

    it('should upload the new image to ImageKit and store CDN URL and fileId when file is provided', async () => {
      const file = { buffer: Buffer.from('new-cover'), originalname: 'new-img.jpg' };
      imagekitService.uploadCollectionImage.mockResolvedValue({
        url:    `${CDN_BASE}/new-uuid.jpg`,
        fileId: 'new-col-fid',
      });
      collectionRepo.findById.mockResolvedValue({ _id: 'col-1', imageFileId: null });
      collectionRepo.update.mockResolvedValue({});

      await updateCollection('col-1', {}, file);

      expect(imagekitService.uploadCollectionImage).toHaveBeenCalledWith(file.buffer, file.originalname);
      expect(collectionRepo.update).toHaveBeenCalledWith(
        'col-1',
        expect.objectContaining({
          image:       `${CDN_BASE}/new-uuid.jpg`,
          imageFileId: 'new-col-fid',
        }),
      );
    });

    it('should delete the old ImageKit file when replacing image and old fileId exists', async () => {
      const file = { buffer: Buffer.from('new-img'), originalname: 'new.jpg' };
      const OLD_FID = 'old-col-fid';
      imagekitService.uploadCollectionImage.mockResolvedValue({
        url: `${CDN_BASE}/new.jpg`, fileId: 'new-fid',
      });
      collectionRepo.findById.mockResolvedValue({ _id: 'col-1', imageFileId: OLD_FID });
      collectionRepo.update.mockResolvedValue({});

      await updateCollection('col-1', {}, file);
      await new Promise((r) => setTimeout(r, 0));

      expect(imagekitService.deleteFile).toHaveBeenCalledWith(OLD_FID);
    });

    it('should NOT call deleteFile when the existing collection has no imageFileId', async () => {
      const file = { buffer: Buffer.from('img'), originalname: 'img.jpg' };
      imagekitService.uploadCollectionImage.mockResolvedValue({
        url: `${CDN_BASE}/new.jpg`, fileId: 'new-fid',
      });
      collectionRepo.findById.mockResolvedValue({ _id: 'col-1', imageFileId: null });
      collectionRepo.update.mockResolvedValue({});

      await updateCollection('col-1', {}, file);
      await new Promise((r) => setTimeout(r, 0));

      expect(imagekitService.deleteFile).not.toHaveBeenCalled();
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
      collectionRepo.findById.mockResolvedValue({ _id: 'col-1', isSystem: false, imageFileId: null });
      collectionRepo.softDelete.mockResolvedValue(undefined);

      const result = await deleteCollection('col-1');

      expect(collectionRepo.softDelete).toHaveBeenCalledWith('col-1');
      expect(result).toEqual({ message: 'Collection removed' });
    });

    it('should delete the ImageKit file before soft deleting when imageFileId exists', async () => {
      const FID = 'col-fid-to-delete';
      collectionRepo.findById.mockResolvedValue({ _id: 'col-1', isSystem: false, imageFileId: FID });
      collectionRepo.softDelete.mockResolvedValue(undefined);

      await deleteCollection('col-1');
      await new Promise((r) => setTimeout(r, 0));

      expect(imagekitService.deleteFile).toHaveBeenCalledWith(FID);
      expect(collectionRepo.softDelete).toHaveBeenCalledWith('col-1');
    });

    it('should NOT call deleteFile when collection has no imageFileId', async () => {
      collectionRepo.findById.mockResolvedValue({ _id: 'col-1', isSystem: false, imageFileId: null });
      collectionRepo.softDelete.mockResolvedValue(undefined);

      await deleteCollection('col-1');
      await new Promise((r) => setTimeout(r, 0));

      expect(imagekitService.deleteFile).not.toHaveBeenCalled();
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
