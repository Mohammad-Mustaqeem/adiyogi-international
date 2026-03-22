/**
 * Unit tests for: ProductsService
 * Module path:    src/services/products.service.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/repositories/product.repository.js', () => ({
  findProducts: vi.fn(),
  countProducts: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
}));

vi.mock('../../../src/utils/helpers.js', () => ({
  parseCollections: vi.fn(),
  makeSlug: vi.fn(),
  numberToWords: vi.fn(),
  buildAdminMessage: vi.fn(),
  buildCustomerMessage: vi.fn(),
}));

import * as productRepo from '../../../src/repositories/product.repository.js';
import * as helpers from '../../../src/utils/helpers.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../../src/services/products.service.js';
import { ApiError } from '../../../src/utils/api-error.js';

const buildProduct = (overrides = {}) => ({
  _id: 'prod-001',
  name: 'Test Product',
  itemCode: 'TP-001',
  salesPrice: 100,
  isActive: true,
  ...overrides,
});

describe('products.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    helpers.parseCollections.mockReturnValue([]);
  });

  // ── getProducts ────────────────────────────────────────────────────────────
  describe('getProducts', () => {
    beforeEach(() => {
      productRepo.findProducts.mockResolvedValue([]);
      productRepo.countProducts.mockResolvedValue(0);
    });

    it('should return products, total, pages, and page', async () => {
      productRepo.findProducts.mockResolvedValue([buildProduct()]);
      productRepo.countProducts.mockResolvedValue(1);

      const result = await getProducts({ page: 1, limit: 12 });

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.pages).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should always include isActive: true in the filter', async () => {
      await getProducts({});

      expect(productRepo.findProducts).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
        expect.any(Object),
      );
    });

    it('should add collection filter when collection is provided and not "all"', async () => {
      await getProducts({ collection: 'col-id-123' });

      expect(productRepo.findProducts).toHaveBeenCalledWith(
        expect.objectContaining({ collections: 'col-id-123' }),
        expect.any(Object),
      );
    });

    it('should NOT add collection filter when collection is "all"', async () => {
      await getProducts({ collection: 'all' });

      const [filter] = productRepo.findProducts.mock.calls[0];
      expect(filter).not.toHaveProperty('collections');
    });

    it('should NOT add collection filter when collection is not provided', async () => {
      await getProducts({});

      const [filter] = productRepo.findProducts.mock.calls[0];
      expect(filter).not.toHaveProperty('collections');
    });

    it('should add $or regex filter when search term is provided', async () => {
      await getProducts({ search: 'kurta' });

      const [filter] = productRepo.findProducts.mock.calls[0];
      expect(filter.$or).toBeDefined();
      expect(filter.$or).toHaveLength(3);
      expect(filter.$or[0].name.$regex).toBe('kurta');
    });

    it('should NOT add $or filter when search is not provided', async () => {
      await getProducts({});

      const [filter] = productRepo.findProducts.mock.calls[0];
      expect(filter.$or).toBeUndefined();
    });

    it('should calculate correct page count', async () => {
      productRepo.countProducts.mockResolvedValue(25);

      const result = await getProducts({ limit: 12 });

      expect(result.pages).toBe(3); // ceil(25/12)
    });

    it('should coerce page to integer', async () => {
      const result = await getProducts({ page: '2', limit: 12 });

      expect(result.page).toBe(2);
    });
  });

  // ── getProductById ─────────────────────────────────────────────────────────
  describe('getProductById', () => {
    it('should return the product when found', async () => {
      const product = buildProduct();
      productRepo.findById.mockResolvedValue(product);

      const result = await getProductById('prod-001');

      expect(result).toEqual(product);
      expect(productRepo.findById).toHaveBeenCalledWith('prod-001');
    });

    it('should throw 404 ApiError when product is not found', async () => {
      productRepo.findById.mockResolvedValue(null);

      await expect(getProductById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Product not found',
      });
    });
  });

  // ── createProduct ──────────────────────────────────────────────────────────
  describe('createProduct', () => {
    it('should create product with parsed collections and no images when files are absent', async () => {
      helpers.parseCollections.mockReturnValue(['col-1', 'col-2']);
      productRepo.create.mockResolvedValue(buildProduct());

      await createProduct({ name: 'Product', itemCode: 'P-001', salesPrice: 100 }, null);

      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ collections: ['col-1', 'col-2'] }),
      );
    });

    it('should map file objects to /uploads/products/{filename} paths when files are provided', async () => {
      const files = [{ filename: 'img1.jpg' }, { filename: 'img2.jpg' }];
      productRepo.create.mockResolvedValue(buildProduct());

      await createProduct({ name: 'Product', itemCode: 'P-001', salesPrice: 100 }, files);

      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          images: ['/uploads/products/img1.jpg', '/uploads/products/img2.jpg'],
        }),
      );
    });

    it('should NOT include images key when files array is empty', async () => {
      productRepo.create.mockResolvedValue(buildProduct());

      await createProduct({ name: 'Product', itemCode: 'P-001', salesPrice: 100 }, []);

      const [data] = productRepo.create.mock.calls[0];
      expect(data.images).toBeUndefined();
    });

    it('should remove the "collection" key from the data before saving', async () => {
      productRepo.create.mockResolvedValue(buildProduct());

      await createProduct({ name: 'P', itemCode: 'P-001', salesPrice: 100, collection: 'col-1' }, null);

      const [data] = productRepo.create.mock.calls[0];
      expect(data.collection).toBeUndefined();
    });
  });

  // ── updateProduct ──────────────────────────────────────────────────────────
  describe('updateProduct', () => {
    it('should update the product with parsed collections', async () => {
      helpers.parseCollections.mockReturnValue(['col-updated']);
      productRepo.update.mockResolvedValue(buildProduct());

      await updateProduct('prod-001', { name: 'Updated' }, null);

      expect(productRepo.update).toHaveBeenCalledWith(
        'prod-001',
        expect.objectContaining({ collections: ['col-updated'] }),
      );
    });

    it('should update images when new files are provided', async () => {
      const files = [{ filename: 'new-img.jpg' }];
      productRepo.update.mockResolvedValue(buildProduct());

      await updateProduct('prod-001', {}, files);

      expect(productRepo.update).toHaveBeenCalledWith(
        'prod-001',
        expect.objectContaining({ images: ['/uploads/products/new-img.jpg'] }),
      );
    });
  });

  // ── deleteProduct ──────────────────────────────────────────────────────────
  describe('deleteProduct', () => {
    it('should call softDelete and return success message', async () => {
      productRepo.softDelete.mockResolvedValue(undefined);

      const result = await deleteProduct('prod-001');

      expect(productRepo.softDelete).toHaveBeenCalledWith('prod-001');
      expect(result).toEqual({ message: 'Product removed' });
    });

    it('should propagate errors from the repository', async () => {
      productRepo.softDelete.mockRejectedValue(new Error('DB error'));

      await expect(deleteProduct('prod-001')).rejects.toThrow('DB error');
    });
  });
});
