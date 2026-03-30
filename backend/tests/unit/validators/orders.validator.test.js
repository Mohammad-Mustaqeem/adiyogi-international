/**
 * Unit tests for: orders validators
 * Module path:    src/validators/orders.validator.js
 * Created:        2026-03-22
 */

import { describe, it, expect } from 'vitest';
import { createOrderSchema } from '../../../src/validators/orders.validator.js';

const validOrder = {
  customer: {
    name: 'John Doe',
    phone: '9876543210',
    address: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  },
  items: [{ productId: 'prod-001', quantity: 2 }],
};

// ── createOrderSchema ──────────────────────────────────────────────────────────
describe('createOrderSchema', () => {
  it('should pass for valid order with minimum required fields', () => {
    expect(() => createOrderSchema.parse(validOrder)).not.toThrow();
  });

  it('should pass when optional customer fields are provided', () => {
    const order = {
      ...validOrder,
      customer: {
        ...validOrder.customer,
        whatsapp: '9876543210',
        email: 'john@example.com',
      },
    };
    expect(() => createOrderSchema.parse(order)).not.toThrow();
  });

  it('should pass when email is an empty string', () => {
    const order = {
      ...validOrder,
      customer: { ...validOrder.customer, email: '' },
    };
    expect(() => createOrderSchema.parse(order)).not.toThrow();
  });

  it('should pass for valid payment modes', () => {
    for (const mode of ['Credit', 'Cash', 'Online', 'UPI']) {
      expect(() => createOrderSchema.parse({ ...validOrder, paymentMode: mode })).not.toThrow();
    }
  });

  it('should fail when customer name is missing', () => {
    const { name, ...customer } = validOrder.customer;
    // Zod v4: missing field raises "invalid_type" not the custom min() message
    expect(() => createOrderSchema.parse({ ...validOrder, customer })).toThrow();
  });

  it('should fail when customer name is empty', () => {
    expect(() =>
      createOrderSchema.parse({ ...validOrder, customer: { ...validOrder.customer, name: '' } }),
    ).toThrow(/Customer name is required/i);
  });

  it('should fail when phone is missing', () => {
    const { phone, ...customer } = validOrder.customer;
    expect(() => createOrderSchema.parse({ ...validOrder, customer })).toThrow();
  });

  it('should fail when address is missing', () => {
    const { address, ...customer } = validOrder.customer;
    expect(() => createOrderSchema.parse({ ...validOrder, customer })).toThrow();
  });

  it('should fail when city is missing', () => {
    const { city, ...customer } = validOrder.customer;
    expect(() => createOrderSchema.parse({ ...validOrder, customer })).toThrow();
  });

  it('should fail when state is missing', () => {
    const { state, ...customer } = validOrder.customer;
    expect(() => createOrderSchema.parse({ ...validOrder, customer })).toThrow();
  });

  it('should fail when pincode is missing', () => {
    const { pincode, ...customer } = validOrder.customer;
    expect(() => createOrderSchema.parse({ ...validOrder, customer })).toThrow();
  });

  it('should fail when items array is empty', () => {
    expect(() => createOrderSchema.parse({ ...validOrder, items: [] })).toThrow(
      /At least one item is required/i,
    );
  });

  it('should fail when items is missing', () => {
    const { items, ...rest } = validOrder;
    expect(() => createOrderSchema.parse(rest)).toThrow();
  });

  it('should fail when a cart item has quantity of 0', () => {
    const order = {
      ...validOrder,
      items: [{ productId: 'prod-001', quantity: 0 }],
    };
    expect(() => createOrderSchema.parse(order)).toThrow();
  });

  it('should fail when a cart item has negative quantity', () => {
    const order = {
      ...validOrder,
      items: [{ productId: 'prod-001', quantity: -1 }],
    };
    expect(() => createOrderSchema.parse(order)).toThrow();
  });

  it('should fail when a cart item is missing productId', () => {
    const order = { ...validOrder, items: [{ quantity: 1 }] };
    expect(() => createOrderSchema.parse(order)).toThrow();
  });

  it('should fail when paymentMode is an invalid value', () => {
    expect(() => createOrderSchema.parse({ ...validOrder, paymentMode: 'Bitcoin' })).toThrow();
  });

  it('should fail when email is an invalid email format', () => {
    const order = {
      ...validOrder,
      customer: { ...validOrder.customer, email: 'not-an-email' },
    };
    expect(() => createOrderSchema.parse(order)).toThrow();
  });

  it('should pass with multiple items', () => {
    const order = {
      ...validOrder,
      items: [
        { productId: 'prod-001', quantity: 1 },
        { productId: 'prod-002', quantity: 3 },
      ],
    };
    expect(() => createOrderSchema.parse(order)).not.toThrow();
  });
});
