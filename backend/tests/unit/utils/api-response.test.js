/**
 * Unit tests for: ApiResponse
 * Module path:    src/utils/api-response.js
 * Created:        2026-03-22
 */

import { describe, it, expect } from 'vitest';
import { ApiResponse } from '../../../src/utils/api-response.js';

describe('ApiResponse', () => {
  it('should set statusCode, data, and message correctly', () => {
    const res = new ApiResponse(200, { id: 1 }, 'OK');
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual({ id: 1 });
    expect(res.message).toBe('OK');
  });

  it('should default message to "Success" when not provided', () => {
    const res = new ApiResponse(200, null);
    expect(res.message).toBe('Success');
  });

  it('should set success to true for 2xx status codes', () => {
    expect(new ApiResponse(200, null).success).toBe(true);
    expect(new ApiResponse(201, null).success).toBe(true);
    expect(new ApiResponse(204, null).success).toBe(true);
    expect(new ApiResponse(399, null).success).toBe(true);
  });

  it('should set success to false for 4xx status codes', () => {
    expect(new ApiResponse(400, null).success).toBe(false);
    expect(new ApiResponse(401, null).success).toBe(false);
    expect(new ApiResponse(404, null).success).toBe(false);
  });

  it('should set success to false for 5xx status codes', () => {
    expect(new ApiResponse(500, null).success).toBe(false);
  });

  it('should accept null as data', () => {
    const res = new ApiResponse(204, null);
    expect(res.data).toBeNull();
  });

  it('should accept array as data', () => {
    const res = new ApiResponse(200, [1, 2, 3]);
    expect(res.data).toEqual([1, 2, 3]);
  });
});
