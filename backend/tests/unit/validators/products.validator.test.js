/**
 * Unit tests for: products validators
 * Module path:    src/validators/products.validator.js
 * Created:        2026-03-22
 */

import { describe, it, expect } from 'vitest';
import {
  createProductSchema,
  updateProductSchema,
} from '../../../src/validators/products.validator.js';

const validProduct = {
  name: 'Test Product',
  itemCode: 'TP-001',
  salesPrice: 100,
};

// ── createProductSchema ────────────────────────────────────────────────────────
describe('createProductSchema', () => {
  it('should pass for valid minimum required fields', () => {
    expect(() => createProductSchema.parse(validProduct)).not.toThrow();
  });

  it('should pass for full valid product with all optional fields', () => {
    const full = {
      ...validProduct,
      description: 'A nice product',
      hsnCode: '6211',
      purchasePrice: 80,
      baseUnit: 'PAC',
      secondaryUnit: 'NOS',
      unitConversionRate: 10,
      stock: 50,
      place: 'Surat',
      gstRate: 5,
    };
    expect(() => createProductSchema.parse(full)).not.toThrow();
  });

  it('should fail when name is missing', () => {
    const { name, ...rest } = validProduct;
    // Zod v4: missing field raises "invalid_type", not the custom min() message
    expect(() => createProductSchema.parse(rest)).toThrow();
  });

  it('should fail when name is empty string', () => {
    expect(() => createProductSchema.parse({ ...validProduct, name: '' })).toThrow(
      /Product name is required/i,
    );
  });

  it('should fail when itemCode is missing', () => {
    const { itemCode, ...rest } = validProduct;
    expect(() => createProductSchema.parse(rest)).toThrow();
  });

  it('should fail when itemCode is empty string', () => {
    expect(() => createProductSchema.parse({ ...validProduct, itemCode: '' })).toThrow(
      /Item code is required/i,
    );
  });

  it('should fail when salesPrice is missing', () => {
    const { salesPrice, ...rest } = validProduct;
    expect(() => createProductSchema.parse(rest)).toThrow();
  });

  it('should fail when salesPrice is zero', () => {
    expect(() => createProductSchema.parse({ ...validProduct, salesPrice: 0 })).toThrow(
      /positive/i,
    );
  });

  it('should fail when salesPrice is negative', () => {
    expect(() => createProductSchema.parse({ ...validProduct, salesPrice: -10 })).toThrow(
      /positive/i,
    );
  });

  it('should coerce salesPrice from string to number', () => {
    const result = createProductSchema.parse({ ...validProduct, salesPrice: '150' });
    expect(result.salesPrice).toBe(150);
  });

  it('should fail when baseUnit is an invalid enum value', () => {
    expect(() => createProductSchema.parse({ ...validProduct, baseUnit: 'KG' })).toThrow();
  });

  it('should pass for baseUnit "PAC"', () => {
    expect(() => createProductSchema.parse({ ...validProduct, baseUnit: 'PAC' })).not.toThrow();
  });

  it('should pass for baseUnit "NOS"', () => {
    expect(() => createProductSchema.parse({ ...validProduct, baseUnit: 'NOS' })).not.toThrow();
  });

  it('should fail when secondaryUnit is an invalid enum value', () => {
    expect(() =>
      createProductSchema.parse({ ...validProduct, secondaryUnit: 'DOZEN' }),
    ).toThrow();
  });

  it('should coerce stock from string to number', () => {
    const result = createProductSchema.parse({ ...validProduct, stock: '25' });
    expect(result.stock).toBe(25);
  });
});

// ── updateProductSchema ────────────────────────────────────────────────────────
describe('updateProductSchema', () => {
  it('should pass for an empty object (all fields optional)', () => {
    expect(() => updateProductSchema.parse({})).not.toThrow();
  });

  it('should pass for partial update with only name', () => {
    expect(() => updateProductSchema.parse({ name: 'Updated Name' })).not.toThrow();
  });

  it('should fail when salesPrice is provided but is zero', () => {
    expect(() => updateProductSchema.parse({ salesPrice: 0 })).toThrow(/positive/i);
  });

  it('should fail when salesPrice is negative', () => {
    expect(() => updateProductSchema.parse({ salesPrice: -1 })).toThrow(/positive/i);
  });

  it('should coerce salesPrice from string to number on partial update', () => {
    const result = updateProductSchema.parse({ salesPrice: '200' });
    expect(result.salesPrice).toBe(200);
  });
});
