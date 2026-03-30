/**
 * Unit tests for: error middleware
 * Module path:    src/middleware/error.middleware.js
 * Created:        2026-03-22
 * Updated:        2026-03-24 — CDN ImageKit migration (added ImageKit CDN error handling)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/config/logger.js', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import errorHandler from '../../../src/middleware/error.middleware.js';
import { ApiError } from '../../../src/utils/api-error.js';

// ── Helpers ────────────────────────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler middleware', () => {
  let res;
  const req  = {};
  const next = vi.fn();

  beforeEach(() => {
    res = mockRes();
    vi.clearAllMocks();
  });

  // ── ApiError ────────────────────────────────────────────────────────────────
  describe('ApiError handling', () => {
    it('should return the ApiError statusCode and message', () => {
      const err = new ApiError(404, 'Resource not found');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Resource not found' });
    });

    it('should return 400 for a 400 ApiError', () => {
      const err = new ApiError(400, 'Bad request');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 for a 401 ApiError', () => {
      const err = new ApiError(401, 'Unauthorized');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 for a 403 ApiError', () => {
      const err = new ApiError(403, 'Forbidden');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ── ValidationError ─────────────────────────────────────────────────────────
  describe('ValidationError handling', () => {
    it('should return 400 for a ValidationError', () => {
      const err = { name: 'ValidationError', message: 'Field required', statusCode: 400 };
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Field required' });
    });

    it('should fall back to 400 when ValidationError has no statusCode', () => {
      const err = { name: 'ValidationError', message: 'Bad data' };
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── CastError ───────────────────────────────────────────────────────────────
  describe('CastError handling (invalid Mongoose ObjectId)', () => {
    it('should return 400 with "Invalid ID format" message', () => {
      const err = { name: 'CastError', message: 'Cast to ObjectId failed' };
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ID format' });
    });
  });

  // ── Multer errors ────────────────────────────────────────────────────────────
  describe('Multer error handling', () => {
    it('should return 400 with "File too large (max 10MB)" for LIMIT_FILE_SIZE', () => {
      const err = { code: 'LIMIT_FILE_SIZE', message: 'File size exceeded' };
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'File too large (max 10MB)' });
    });

    it('should return 400 when message is "Only image files allowed"', () => {
      const err = { message: 'Only image files allowed' };
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Only image files allowed' });
    });
  });

  // ── ImageKit CDN errors ───────────────────────────────────────────────────────
  describe('ImageKit CDN error handling', () => {
    it('should return 502 when error message contains "imagekit"', () => {
      const err = new Error('imagekit upload failed with status 500');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'CDN service error. Please try again.' }),
      );
    });

    it('should return 502 when error message contains "ik.imagekit" (CDN domain)', () => {
      const err = new Error('Failed to reach ik.imagekit.io endpoint');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'CDN service error. Please try again.' }),
      );
    });

    it('should match "imagekit" case-insensitively', () => {
      const err = new Error('ImageKit API rate limit exceeded');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(502);
    });

    it('should include error detail in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const err = new Error('imagekit timeout');
      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ detail: 'imagekit timeout' }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should NOT include error detail in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const err = new Error('imagekit timeout');
      errorHandler(err, req, res, next);

      const [jsonArg] = res.json.mock.calls[0];
      expect(jsonArg).not.toHaveProperty('detail');

      process.env.NODE_ENV = originalEnv;
    });
  });

  // ── Generic error ────────────────────────────────────────────────────────────
  describe('Generic error handling', () => {
    it('should return 500 with the error message for unhandled errors', () => {
      const err = new Error('Unexpected failure');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unexpected failure' });
    });
  });
});
