/**
 * Unit tests for: ImageKitService
 * Module path:    src/services/imagekit.service.js
 * Created:        2026-03-24
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/config/imagekit.config.js', () => ({
  default: {
    upload:     vi.fn(),
    deleteFile: vi.fn(),
  },
}));

vi.mock('../../../src/config/env.js', () => ({
  env: {
    IMAGEKIT_PRODUCT_IMAGES_FOLDER:    'adiyogi/product-images',
    IMAGEKIT_COLLECTION_IMAGES_FOLDER: 'adiyogi/collection-images',
    IMAGEKIT_INVOICES_FOLDER:          'adiyogi/invoices',
  },
}));

vi.mock('../../../src/config/logger.js', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-uuid-1234'),
}));

import imagekit from '../../../src/config/imagekit.config.js';
import {
  uploadProductImage,
  uploadProductImages,
  uploadCollectionImage,
  uploadInvoicePdf,
  deleteFile,
  deleteFiles,
} from '../../../src/services/imagekit.service.js';
import * as logger from '../../../src/config/logger.js';

const FAKE_UPLOAD_RESPONSE = {
  url:      'https://ik.imagekit.io/test/adiyogi/product-images/product-test-uuid-1234.jpg',
  fileId:   'ik-file-id-001',
  filePath: '/adiyogi/product-images/product-test-uuid-1234.jpg',
};

describe('imagekit.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    imagekit.upload.mockResolvedValue(FAKE_UPLOAD_RESPONSE);
    imagekit.deleteFile.mockResolvedValue(undefined);
  });

  // ── uploadProductImage ──────────────────────────────────────────────────────
  describe('uploadProductImage', () => {
    it('should call imagekit.upload with the correct folder and a uuid-based filename', async () => {
      const buffer = Buffer.from('fake-image');

      await uploadProductImage(buffer, 'photo.jpg');

      expect(imagekit.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          file:              buffer,
          fileName:          'product-test-uuid-1234.jpg',
          folder:            'adiyogi/product-images',
          useUniqueFileName: false,
          tags:              ['product'],
        }),
      );
    });

    it('should return url and fileId from the ImageKit response', async () => {
      const result = await uploadProductImage(Buffer.from('img'), 'img.jpg');

      expect(result.url).toBe(FAKE_UPLOAD_RESPONSE.url);
      expect(result.fileId).toBe(FAKE_UPLOAD_RESPONSE.fileId);
    });

    it('should preserve the original file extension in the generated filename', async () => {
      await uploadProductImage(Buffer.from('img'), 'photo.png');

      expect(imagekit.upload).toHaveBeenCalledWith(
        expect.objectContaining({ fileName: 'product-test-uuid-1234.png' }),
      );
    });

    it('should fall back to .jpg extension when originalname has no extension', async () => {
      await uploadProductImage(Buffer.from('img'), 'no-ext');

      expect(imagekit.upload).toHaveBeenCalledWith(
        expect.objectContaining({ fileName: 'product-test-uuid-1234.jpg' }),
      );
    });

    it('should propagate errors thrown by imagekit.upload', async () => {
      imagekit.upload.mockRejectedValue(new Error('ImageKit network error'));

      await expect(uploadProductImage(Buffer.from('img'), 'a.jpg')).rejects.toThrow(
        'ImageKit network error',
      );
    });
  });

  // ── uploadProductImages ─────────────────────────────────────────────────────
  describe('uploadProductImages', () => {
    it('should upload all files in parallel and return an array of results', async () => {
      const files = [
        { buffer: Buffer.from('img1'), originalname: 'img1.jpg' },
        { buffer: Buffer.from('img2'), originalname: 'img2.png' },
      ];

      const results = await uploadProductImages(files);

      expect(imagekit.upload).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('url');
      expect(results[0]).toHaveProperty('fileId');
    });

    it('should return an empty array when given no files', async () => {
      const results = await uploadProductImages([]);

      expect(imagekit.upload).not.toHaveBeenCalled();
      expect(results).toEqual([]);
    });

    it('should reject if any single upload fails', async () => {
      imagekit.upload.mockRejectedValueOnce(new Error('CDN error'));
      const files = [{ buffer: Buffer.from('img'), originalname: 'img.jpg' }];

      await expect(uploadProductImages(files)).rejects.toThrow('CDN error');
    });
  });

  // ── uploadCollectionImage ───────────────────────────────────────────────────
  describe('uploadCollectionImage', () => {
    it('should call imagekit.upload with the collection folder and uuid-based filename', async () => {
      await uploadCollectionImage(Buffer.from('col-img'), 'cover.jpg');

      expect(imagekit.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'collection-test-uuid-1234.jpg',
          folder:   'adiyogi/collection-images',
          tags:     ['collection'],
        }),
      );
    });

    it('should return url and fileId from the ImageKit response', async () => {
      const result = await uploadCollectionImage(Buffer.from('img'), 'cover.webp');

      expect(result.url).toBe(FAKE_UPLOAD_RESPONSE.url);
      expect(result.fileId).toBe(FAKE_UPLOAD_RESPONSE.fileId);
    });
  });

  // ── uploadInvoicePdf ────────────────────────────────────────────────────────
  describe('uploadInvoicePdf', () => {
    it('should call imagekit.upload with the invoices folder and orderId in the filename', async () => {
      await uploadInvoicePdf(Buffer.from('%PDF-1.4'), 'ADI-0001');

      expect(imagekit.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'invoice-ADI-0001-test-uuid-1234.pdf',
          folder:   'adiyogi/invoices',
          tags:     ['invoice'],
        }),
      );
    });

    it('should return url and fileId from the ImageKit response', async () => {
      const result = await uploadInvoicePdf(Buffer.from('pdf'), 'ADI-0002');

      expect(result.url).toBe(FAKE_UPLOAD_RESPONSE.url);
      expect(result.fileId).toBe(FAKE_UPLOAD_RESPONSE.fileId);
    });

    it('should propagate errors from imagekit.upload', async () => {
      imagekit.upload.mockRejectedValue(new Error('Upload failed'));

      await expect(uploadInvoicePdf(Buffer.from('pdf'), 'ADI-0003')).rejects.toThrow('Upload failed');
    });
  });

  // ── deleteFile ──────────────────────────────────────────────────────────────
  describe('deleteFile', () => {
    it('should call imagekit.deleteFile with the given fileId', async () => {
      await deleteFile('ik-file-id-abc');

      expect(imagekit.deleteFile).toHaveBeenCalledWith('ik-file-id-abc');
    });

    it('should NOT call imagekit.deleteFile when fileId is null', async () => {
      await deleteFile(null);

      expect(imagekit.deleteFile).not.toHaveBeenCalled();
    });

    it('should NOT call imagekit.deleteFile when fileId is undefined', async () => {
      await deleteFile(undefined);

      expect(imagekit.deleteFile).not.toHaveBeenCalled();
    });

    it('should NOT call imagekit.deleteFile when fileId is an empty string', async () => {
      await deleteFile('');

      expect(imagekit.deleteFile).not.toHaveBeenCalled();
    });

    it('should log a warning and not throw when imagekit.deleteFile fails', async () => {
      imagekit.deleteFile.mockRejectedValue(new Error('Not found in CDN'));

      await expect(deleteFile('bad-id')).resolves.toBeUndefined();
      expect(logger.logger.warn).toHaveBeenCalled();
    });
  });

  // ── deleteFiles ─────────────────────────────────────────────────────────────
  describe('deleteFiles', () => {
    it('should call imagekit.deleteFile for each valid fileId', async () => {
      await deleteFiles(['id-1', 'id-2', 'id-3']);

      expect(imagekit.deleteFile).toHaveBeenCalledTimes(3);
      expect(imagekit.deleteFile).toHaveBeenCalledWith('id-1');
      expect(imagekit.deleteFile).toHaveBeenCalledWith('id-2');
      expect(imagekit.deleteFile).toHaveBeenCalledWith('id-3');
    });

    it('should skip null and undefined entries in the array', async () => {
      await deleteFiles(['id-1', null, undefined, 'id-2']);

      expect(imagekit.deleteFile).toHaveBeenCalledTimes(2);
    });

    it('should do nothing when given an empty array', async () => {
      await deleteFiles([]);

      expect(imagekit.deleteFile).not.toHaveBeenCalled();
    });

    it('should do nothing when called with no argument', async () => {
      await deleteFiles();

      expect(imagekit.deleteFile).not.toHaveBeenCalled();
    });
  });
});
