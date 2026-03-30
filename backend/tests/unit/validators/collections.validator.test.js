/**
 * Unit tests for: collections validators
 * Module path:    src/validators/collections.validator.js
 * Created:        2026-03-22
 */

import { describe, it, expect } from 'vitest';
import {
  createCollectionSchema,
  updateCollectionSchema,
} from '../../../src/validators/collections.validator.js';

// ── createCollectionSchema ─────────────────────────────────────────────────────
describe('createCollectionSchema', () => {
  it('should pass for valid name', () => {
    expect(() => createCollectionSchema.parse({ name: 'New Arrivals' })).not.toThrow();
  });

  it('should trim whitespace from name', () => {
    const result = createCollectionSchema.parse({ name: '  New Arrivals  ' });
    expect(result.name).toBe('New Arrivals');
  });

  it('should pass with all optional fields provided', () => {
    expect(() =>
      createCollectionSchema.parse({
        name: 'Summer Collection',
        description: 'Hot summer items',
        sortOrder: 2,
      }),
    ).not.toThrow();
  });

  it('should fail when name is missing', () => {
    // Zod v4: missing field raises "invalid_type", not the custom min() message
    expect(() => createCollectionSchema.parse({})).toThrow();
  });

  it('should fail when name is empty string', () => {
    expect(() => createCollectionSchema.parse({ name: '' })).toThrow(
      /Collection name is required/i,
    );
  });

  it('should coerce sortOrder from string to number', () => {
    const result = createCollectionSchema.parse({ name: 'Test', sortOrder: '3' });
    expect(result.sortOrder).toBe(3);
  });

  it('should pass when description is not provided', () => {
    expect(() => createCollectionSchema.parse({ name: 'Test' })).not.toThrow();
  });
});

// ── updateCollectionSchema ─────────────────────────────────────────────────────
describe('updateCollectionSchema', () => {
  it('should pass for an empty object (all fields optional)', () => {
    expect(() => updateCollectionSchema.parse({})).not.toThrow();
  });

  it('should pass for partial update with only name', () => {
    expect(() => updateCollectionSchema.parse({ name: 'Updated Name' })).not.toThrow();
  });

  it('should trim whitespace from name on update', () => {
    const result = updateCollectionSchema.parse({ name: '  Trimmed  ' });
    expect(result.name).toBe('Trimmed');
  });

  it('should fail when name is provided but empty', () => {
    expect(() => updateCollectionSchema.parse({ name: '' })).toThrow();
  });

  it('should coerce sortOrder from string to number', () => {
    const result = updateCollectionSchema.parse({ sortOrder: '5' });
    expect(result.sortOrder).toBe(5);
  });

  it('should pass for partial update with only description', () => {
    expect(() => updateCollectionSchema.parse({ description: 'New description' })).not.toThrow();
  });
});
