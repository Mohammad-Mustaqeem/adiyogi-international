/**
 * Unit tests for: multer middleware
 * Module path:    src/middleware/multer.middleware.js
 * Created:        2026-03-22
 * Updated:        2026-03-24 — CDN ImageKit migration (memory storage replaces disk storage)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted shares state between the mock factory (hoisted) and the test suite
const state = vi.hoisted(() => ({
  fileFilters:  [],   // imageFilter instances captured per multer() call
  multerOpts:   [],   // full opts passed to multer()
  arrayCalls:   [],   // args passed to .array()
  singleCalls:  [],   // args passed to .single()
  memoryStorageCalls: 0,
}));

vi.mock('multer', () => {
  // Simulate the middleware function returned by .array() / .single()
  const arrayMiddleware  = vi.fn();
  const singleMiddleware = vi.fn();

  const mockInstance = {
    array:  vi.fn().mockImplementation((field, max) => {
      state.arrayCalls.push({ field, max });
      return arrayMiddleware;
    }),
    single: vi.fn().mockImplementation((field) => {
      state.singleCalls.push({ field });
      return singleMiddleware;
    }),
  };

  const memoryStorage = vi.fn().mockImplementation(() => {
    state.memoryStorageCalls++;
    return { _type: 'memory' };
  });

  const multer = vi.fn().mockImplementation((opts) => {
    state.fileFilters.push(opts.fileFilter);
    state.multerOpts.push(opts);
    return mockInstance;
  });

  multer.memoryStorage = memoryStorage;
  return { default: multer };
});

import multer from 'multer';
import { uploadProductImages, uploadCollectionImage } from '../../../src/middleware/multer.middleware.js';

describe('multer.middleware', () => {
  // ── Module exports ─────────────────────────────────────────────────────────
  describe('exports', () => {
    it('should export uploadProductImages as a middleware function', () => {
      expect(uploadProductImages).toBeDefined();
      expect(typeof uploadProductImages).toBe('function');
    });

    it('should export uploadCollectionImage as a middleware function', () => {
      expect(uploadCollectionImage).toBeDefined();
      expect(typeof uploadCollectionImage).toBe('function');
    });

    it('should create two separate multer instances (one per upload type)', () => {
      expect(multer).toHaveBeenCalledTimes(2);
    });
  });

  // ── Memory storage ─────────────────────────────────────────────────────────
  describe('memory storage', () => {
    it('should use multer.memoryStorage() — never write files to disk', () => {
      expect(multer.memoryStorage).toHaveBeenCalled();
      expect(state.memoryStorageCalls).toBeGreaterThan(0);
    });

    it('should pass the memory storage instance to both multer configurations', () => {
      const memoryStorageInstance = multer.memoryStorage.mock.results[0].value;
      state.multerOpts.forEach((opts) => {
        expect(opts.storage).toBe(memoryStorageInstance);
      });
    });
  });

  // ── Field configuration ────────────────────────────────────────────────────
  describe('field configuration', () => {
    it('should configure uploadProductImages with .array("images", 10)', () => {
      expect(state.arrayCalls).toContainEqual({ field: 'images', max: 10 });
    });

    it('should configure uploadCollectionImage with .single("image")', () => {
      expect(state.singleCalls).toContainEqual({ field: 'image' });
    });
  });

  // ── File size limit ────────────────────────────────────────────────────────
  describe('file size limit', () => {
    it('should enforce a 10 MB file size limit for product images', () => {
      expect(state.multerOpts[0].limits.fileSize).toBe(10 * 1024 * 1024);
    });

    it('should enforce a 10 MB file size limit for collection images', () => {
      expect(state.multerOpts[1].limits.fileSize).toBe(10 * 1024 * 1024);
    });
  });

  // ── imageFilter ────────────────────────────────────────────────────────────
  describe('imageFilter', () => {
    let imageFilter;

    beforeEach(() => {
      // Both instances share the same imageFilter function reference
      imageFilter = state.fileFilters[0];
    });

    it('should call cb(null, true) for image/jpeg files', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'image/jpeg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should call cb(null, true) for image/png files', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'image/png' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should call cb(null, true) for image/webp files', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'image/webp' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should call cb(null, true) for any image/* MIME type', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'image/gif' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should call cb(Error) with "Only image files allowed" for application/pdf', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'application/pdf' }, cb);
      const [err] = cb.mock.calls[0];
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Only image files allowed');
    });

    it('should call cb(Error) for text/plain files', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'text/plain' }, cb);
      const [err] = cb.mock.calls[0];
      expect(err).toBeInstanceOf(Error);
    });

    it('should call cb(Error) for video/mp4 files', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'video/mp4' }, cb);
      const [err] = cb.mock.calls[0];
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Only image files allowed');
    });
  });
});
