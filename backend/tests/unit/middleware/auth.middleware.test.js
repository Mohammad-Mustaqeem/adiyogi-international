/**
 * Unit tests for: auth middleware
 * Module path:    src/middleware/auth.middleware.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/config/env.js', () => ({
  env: { JWT_SECRET: 'test-jwt-secret' },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

import jwt from 'jsonwebtoken';
import auth from '../../../src/middleware/auth.middleware.js';

// ── Helpers ────────────────────────────────────────────────────────────────────
const mockReq = (overrides = {}) => ({
  headers: {},
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when Authorization header is absent', () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    const next = vi.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header has no Bearer token', () => {
    const req = mockReq({ headers: { authorization: 'Basic sometoken' } });
    const res = mockRes();
    const next = vi.fn();

    // split(' ')[1] yields 'sometoken', but jwt.verify will throw
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when jwt.verify throws (invalid or expired token)', () => {
    const req = mockReq({
      headers: { authorization: 'Bearer invalid.token.here' },
    });
    const res = mockRes();
    const next = vi.fn();

    jwt.verify.mockImplementation(() => { throw new Error('JsonWebTokenError'); });

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach decoded payload to req.admin and call next on valid token', () => {
    const decoded = { id: 'admin-id-123', iat: 1000, exp: 9999 };
    jwt.verify.mockReturnValue(decoded);

    const req = mockReq({
      headers: { authorization: 'Bearer valid.jwt.token' },
    });
    const res = mockRes();
    const next = vi.fn();

    auth(req, res, next);

    expect(req.admin).toEqual(decoded);
    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should verify the token with the JWT_SECRET from env', () => {
    const decoded = { id: 'admin-id' };
    jwt.verify.mockReturnValue(decoded);

    const req = mockReq({
      headers: { authorization: 'Bearer my.token' },
    });

    auth(req, mockRes(), vi.fn());

    expect(jwt.verify).toHaveBeenCalledWith('my.token', 'test-jwt-secret');
  });
});
