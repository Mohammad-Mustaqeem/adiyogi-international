/**
 * Unit tests for: admin validators
 * Module path:    src/validators/admin.validator.js
 * Created:        2026-03-22
 */

import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  setupSchema,
  updateOrderStatusSchema,
} from '../../../src/validators/admin.validator.js';

// ── loginSchema ────────────────────────────────────────────────────────────────
describe('loginSchema', () => {
  const valid = { username: 'admin', password: 'secret' };

  it('should pass for valid username and password', () => {
    expect(() => loginSchema.parse(valid)).not.toThrow();
  });

  it('should fail when username is missing', () => {
    expect(() => loginSchema.parse({ password: 'secret' })).toThrow();
  });

  it('should fail when username is empty string', () => {
    expect(() => loginSchema.parse({ ...valid, username: '' })).toThrow(/Username is required/i);
  });

  it('should fail when password is missing', () => {
    expect(() => loginSchema.parse({ username: 'admin' })).toThrow();
  });

  it('should fail when password is empty string', () => {
    expect(() => loginSchema.parse({ ...valid, password: '' })).toThrow(/Password is required/i);
  });

  it('should fail when both fields are missing', () => {
    expect(() => loginSchema.parse({})).toThrow();
  });
});

// ── setupSchema ────────────────────────────────────────────────────────────────
describe('setupSchema', () => {
  const valid = {
    username: 'admin',
    password: 'secret123',
    whatsappNumber: '919999999999',
  };

  it('should pass for valid required fields', () => {
    expect(() => setupSchema.parse(valid)).not.toThrow();
  });

  it('should pass when optional name field is included', () => {
    expect(() => setupSchema.parse({ ...valid, name: 'Admin User' })).not.toThrow();
  });

  it('should fail when username is missing', () => {
    const { username, ...rest } = valid;
    expect(() => setupSchema.parse(rest)).toThrow();
  });

  it('should fail when username is empty', () => {
    expect(() => setupSchema.parse({ ...valid, username: '' })).toThrow(/Username is required/i);
  });

  it('should fail when password is shorter than 6 characters', () => {
    expect(() => setupSchema.parse({ ...valid, password: 'abc' })).toThrow(
      /at least 6 characters/i,
    );
  });

  it('should fail when password is exactly 5 characters', () => {
    expect(() => setupSchema.parse({ ...valid, password: 'abcde' })).toThrow();
  });

  it('should pass when password is exactly 6 characters', () => {
    expect(() => setupSchema.parse({ ...valid, password: 'abcdef' })).not.toThrow();
  });

  it('should fail when whatsappNumber is missing', () => {
    const { whatsappNumber, ...rest } = valid;
    expect(() => setupSchema.parse(rest)).toThrow();
  });

  it('should fail when whatsappNumber is empty', () => {
    expect(() => setupSchema.parse({ ...valid, whatsappNumber: '' })).toThrow(
      /WhatsApp number is required/i,
    );
  });
});

// ── updateOrderStatusSchema ────────────────────────────────────────────────────
describe('updateOrderStatusSchema', () => {
  it.each(['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'])(
    'should pass for valid status "%s"',
    (status) => {
      expect(() => updateOrderStatusSchema.parse({ status })).not.toThrow();
    },
  );

  it('should fail when status is an invalid value', () => {
    expect(() => updateOrderStatusSchema.parse({ status: 'Processing' })).toThrow();
  });

  it('should fail when status is missing', () => {
    expect(() => updateOrderStatusSchema.parse({})).toThrow();
  });

  it('should fail when status is empty string', () => {
    expect(() => updateOrderStatusSchema.parse({ status: '' })).toThrow();
  });
});
