/**
 * Unit tests for: helpers
 * Module path:    src/utils/helpers.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  numberToWords,
  makeSlug,
  parseCollections,
  buildAdminMessage,
  buildCustomerMessage,
} from '../../../src/utils/helpers.js';

// ── Shared Fixtures ────────────────────────────────────────────────────────────
const buildOrder = (overrides = {}) => ({
  orderId: 'ADI-0001',
  createdAt: new Date('2024-01-15T10:00:00Z'),
  paymentMode: 'Credit',
  total: 1500.0,
  subtotal: 1500.0,
  customer: {
    name: 'John Doe',
    phone: '9876543210',
    whatsapp: '9876543210',
    address: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  },
  items: [
    {
      name: 'Test Product',
      itemCode: 'TP-001',
      hsnCode: '6211',
      quantity: 2,
      price: 750,
      amount: 1500,
    },
  ],
  ...overrides,
});

// ── numberToWords ──────────────────────────────────────────────────────────────
describe('numberToWords', () => {
  it('should return "Zero" when input is 0', () => {
    expect(numberToWords(0)).toBe('Zero');
  });

  it('should return correct word for single-digit numbers', () => {
    expect(numberToWords(1)).toBe('One');
    expect(numberToWords(9)).toBe('Nine');
  });

  it('should return correct word for teen numbers', () => {
    expect(numberToWords(11)).toBe('Eleven');
    expect(numberToWords(19)).toBe('Nineteen');
  });

  it('should return correct word for tens without remainder', () => {
    expect(numberToWords(20)).toBe('Twenty');
    expect(numberToWords(90)).toBe('Ninety');
  });

  it('should return correct word for compound tens', () => {
    expect(numberToWords(25)).toBe('Twenty Five');
    expect(numberToWords(99)).toBe('Ninety Nine');
  });

  it('should return correct word for hundreds', () => {
    expect(numberToWords(100)).toBe('One Hundred');
    expect(numberToWords(500)).toBe('Five Hundred');
  });

  it('should return correct word for hundreds with remainder', () => {
    expect(numberToWords(101)).toBe('One Hundred One');
    expect(numberToWords(999)).toBe('Nine Hundred Ninety Nine');
  });

  it('should return correct word for thousands', () => {
    expect(numberToWords(1000)).toBe('One Thousand');
    expect(numberToWords(5000)).toBe('Five Thousand');
  });

  it('should return correct word for thousands with remainder', () => {
    expect(numberToWords(1500)).toBe('One Thousand Five Hundred');
    expect(numberToWords(99999)).toBe('Ninety Nine Thousand Nine Hundred Ninety Nine');
  });

  it('should return correct word for lakhs', () => {
    expect(numberToWords(100000)).toBe('One Lakh');
    expect(numberToWords(500000)).toBe('Five Lakh');
  });

  it('should return correct word for lakhs with remainder', () => {
    expect(numberToWords(150000)).toBe('One Lakh Fifty Thousand');
  });

  it('should return correct word for crores', () => {
    expect(numberToWords(10000000)).toBe('One Crore');
  });

  it('should return correct word for crores with remainder', () => {
    expect(numberToWords(15000000)).toBe('One Crore Fifty Lakh');
  });
});

// ── makeSlug ───────────────────────────────────────────────────────────────────
describe('makeSlug', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should convert spaces to hyphens and lowercase the name', () => {
    const result = makeSlug('My Collection');
    expect(result).toMatch(/^my-collection-/);
  });

  it('should append the current timestamp', () => {
    const expectedTimestamp = new Date('2024-01-01T00:00:00.000Z').getTime();
    const result = makeSlug('Test');
    expect(result).toBe(`test-${expectedTimestamp}`);
  });

  it('should remove special characters but preserve hyphens around them', () => {
    // "New & Arrivals!" → lowercase → "new & arrivals!" → spaces→hyphens → "new-&-arrivals!" → strip non-alnum-hyphen → "new--arrivals"
    const result = makeSlug('New & Arrivals!');
    expect(result).toMatch(/^new--arrivals-/);
  });

  it('should handle names that are already lowercase', () => {
    const result = makeSlug('lowercase name');
    expect(result).toMatch(/^lowercase-name-/);
  });

  it('should collapse multiple spaces into single hyphens', () => {
    const result = makeSlug('multiple  spaces');
    expect(result).toMatch(/^multiple-spaces-/);
  });
});

// ── parseCollections ───────────────────────────────────────────────────────────
describe('parseCollections', () => {
  it('should return empty array when collections field is absent', () => {
    expect(parseCollections({})).toEqual([]);
  });

  it('should return empty array when collections is undefined', () => {
    expect(parseCollections({ collections: undefined })).toEqual([]);
  });

  it('should return the array as-is when collections is already an array', () => {
    const ids = ['id1', 'id2', 'id3'];
    expect(parseCollections({ collections: ids })).toEqual(ids);
  });

  it('should filter falsy values from array', () => {
    expect(parseCollections({ collections: ['id1', '', null, 'id2'] })).toEqual(['id1', 'id2']);
  });

  it('should parse a valid JSON array string', () => {
    expect(parseCollections({ collections: '["id1","id2"]' })).toEqual(['id1', 'id2']);
  });

  it('should wrap a plain string in an array when JSON.parse fails', () => {
    expect(parseCollections({ collections: 'single-id' })).toEqual(['single-id']);
  });

  it('should return empty array when collections is an empty array', () => {
    expect(parseCollections({ collections: [] })).toEqual([]);
  });
});

// ── buildAdminMessage ──────────────────────────────────────────────────────────
describe('buildAdminMessage', () => {
  it('should include the order ID in the message', () => {
    const order = buildOrder();
    const msg = buildAdminMessage(order);
    expect(msg).toContain('ADI-0001');
  });

  it('should include the customer name', () => {
    const order = buildOrder();
    const msg = buildAdminMessage(order);
    expect(msg).toContain('John Doe');
  });

  it('should include the total amount', () => {
    const order = buildOrder();
    const msg = buildAdminMessage(order);
    expect(msg).toContain('1500.00');
  });

  it('should include item name and code', () => {
    const order = buildOrder();
    const msg = buildAdminMessage(order);
    expect(msg).toContain('Test Product');
    expect(msg).toContain('TP-001');
  });

  it('should include total in words', () => {
    const order = buildOrder({ total: 1500 });
    const msg = buildAdminMessage(order);
    expect(msg).toContain('One Thousand Five Hundred');
  });

  it('should use customer phone as WhatsApp when whatsapp field is absent', () => {
    const order = buildOrder({ customer: { ...buildOrder().customer, whatsapp: undefined } });
    const msg = buildAdminMessage(order);
    expect(msg).toContain('9876543210');
  });

  it('should include payment mode', () => {
    const order = buildOrder({ paymentMode: 'UPI' });
    const msg = buildAdminMessage(order);
    expect(msg).toContain('UPI');
  });
});

// ── buildCustomerMessage ───────────────────────────────────────────────────────
describe('buildCustomerMessage', () => {
  it('should include the order ID', () => {
    const order = buildOrder();
    const msg = buildCustomerMessage(order);
    expect(msg).toContain('ADI-0001');
  });

  it('should include item names', () => {
    const order = buildOrder();
    const msg = buildCustomerMessage(order);
    expect(msg).toContain('Test Product');
  });

  it('should include the total amount', () => {
    const order = buildOrder();
    const msg = buildCustomerMessage(order);
    expect(msg).toContain('1500.00');
  });

  it('should include delivery city and state', () => {
    const order = buildOrder();
    const msg = buildCustomerMessage(order);
    expect(msg).toContain('Mumbai');
    expect(msg).toContain('Maharashtra');
  });

  it('should include ORDER CONFIRMED text', () => {
    const order = buildOrder();
    const msg = buildCustomerMessage(order);
    expect(msg).toContain('ORDER CONFIRMED');
  });
});
