/**
 * Unit tests for: validate middleware
 * Module path:    src/middleware/validate.middleware.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validate } from '../../../src/middleware/validate.middleware.js';

// ── Helpers ────────────────────────────────────────────────────────────────────
const mockReq = (body = {}) => ({ body });
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.coerce.number().positive('Age must be positive'),
});

describe('validate middleware', () => {
  let next;

  beforeEach(() => {
    next = vi.fn();
  });

  it('should call next() without args and mutate req.body when input is valid', () => {
    const req = mockReq({ name: 'Alice', age: '25' });
    validate(testSchema)(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body.name).toBe('Alice');
    expect(req.body.age).toBe(25); // coerced from string
  });

  it('should call next with a ValidationError when schema parse fails', () => {
    const req = mockReq({ name: '', age: -1 });
    validate(testSchema)(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.name).toBe('ValidationError');
    expect(error.statusCode).toBe(400);
    expect(typeof error.message).toBe('string');
    expect(error.message.length).toBeGreaterThan(0);
  });

  it('should combine multiple Zod error messages with a comma separator', () => {
    const req = mockReq({ name: '', age: -1 });
    validate(testSchema)(req, mockRes(), next);

    const error = next.mock.calls[0][0];
    // Multiple errors should be joined
    expect(error.message).toContain(',');
  });

  it('should pass a non-Zod error directly to next', () => {
    const unexpectedError = new Error('Unexpected');
    const badSchema = {
      parse: () => { throw unexpectedError; },
    };
    const req = mockReq({ name: 'test' });
    validate(badSchema)(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(unexpectedError);
  });

  it('should NOT send an HTTP response directly (delegates to error middleware)', () => {
    const req = mockReq({ name: '' });
    const res = mockRes();
    validate(testSchema)(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return a function (middleware factory pattern)', () => {
    expect(typeof validate(testSchema)).toBe('function');
  });
});
