/**
 * Unit tests for: asyncHandler
 * Module path:    src/utils/async-handler.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi } from 'vitest';
import { asyncHandler } from '../../../src/utils/async-handler.js';

// ── Helpers ────────────────────────────────────────────────────────────────────
const mockReq = () => ({});
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('asyncHandler', () => {
  it('should call the handler with req, res, and next', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await wrapped(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
  });

  it('should NOT call next when the handler resolves successfully', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);
    const next = vi.fn();

    await wrapped(mockReq(), mockRes(), next);

    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with the error when the handler rejects', async () => {
    const error = new Error('Something failed');
    const handler = vi.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(handler);
    const next = vi.fn();

    await wrapped(mockReq(), mockRes(), next);

    expect(next).toHaveBeenCalledWith(error);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should propagate synchronous throws without calling next (not caught by asyncHandler)', async () => {
    // asyncHandler calls Promise.resolve(handler(...)), but if handler throws
    // synchronously, the throw escapes before Promise.resolve is reached.
    const error = new Error('Sync throw');
    const handler = vi.fn().mockImplementation(() => { throw error; });
    const wrapped = asyncHandler(handler);
    const next = vi.fn();

    await expect(async () => wrapped(mockReq(), mockRes(), next)).rejects.toThrow('Sync throw');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return a function', () => {
    const wrapped = asyncHandler(vi.fn());
    expect(typeof wrapped).toBe('function');
  });
});
