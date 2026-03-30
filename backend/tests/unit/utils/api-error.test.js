/**
 * Unit tests for: ApiError
 * Module path:    src/utils/api-error.js
 * Created:        2026-03-22
 */

import { describe, it, expect } from 'vitest';
import { ApiError } from '../../../src/utils/api-error.js';

describe('ApiError', () => {
  describe('constructor', () => {
    it('should set statusCode and message correctly', () => {
      const err = new ApiError(404, 'Not found');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Not found');
    });

    it('should use default message when none provided', () => {
      const err = new ApiError(500);
      expect(err.message).toBe('Something went wrong.');
    });

    it('should set success to false', () => {
      const err = new ApiError(400, 'Bad request');
      expect(err.success).toBe(false);
    });

    it('should set data to null', () => {
      const err = new ApiError(400, 'Bad request');
      expect(err.data).toBeNull();
    });

    it('should default errors to empty array', () => {
      const err = new ApiError(400, 'Bad request');
      expect(err.errors).toEqual([]);
    });

    it('should accept a custom errors array', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      const err = new ApiError(422, 'Validation failed', errors);
      expect(err.errors).toEqual(errors);
    });

    it('should use provided stack instead of capturing a new one', () => {
      const customStack = 'custom stack trace';
      const err = new ApiError(500, 'Error', [], customStack);
      expect(err.stack).toBe(customStack);
    });

    it('should capture a stack trace when none is provided', () => {
      const err = new ApiError(500, 'Error');
      expect(err.stack).toBeDefined();
      expect(typeof err.stack).toBe('string');
    });

    it('should be an instance of Error', () => {
      const err = new ApiError(400, 'Bad request');
      expect(err).toBeInstanceOf(Error);
    });

    it('should be an instance of ApiError', () => {
      const err = new ApiError(400, 'Bad request');
      expect(err).toBeInstanceOf(ApiError);
    });
  });
});
