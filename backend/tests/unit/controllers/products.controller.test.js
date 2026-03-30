/**
 * Unit tests for: ProductsController
 * Module path:    src/controllers/products.controller.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/services/products.service.js', () => ({
  getProducts: vi.fn(),
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

import * as productsService from '../../../src/services/products.service.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../../src/controllers/products.controller.js';
import { ApiError } from '../../../src/utils/api-error.js';

// ── Helpers ────────────────────────────────────────────────────────────────────
const mockReq = (overrides = {}) => ({ body: {}, params: {}, query: {}, files: null, ...overrides });

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// asyncHandler does not return the inner Promise; flush microtasks before asserting.
const flushPromises = () => new Promise((r) => setTimeout(r, 0));

describe('products.controller', () => {
  let res, next;

  beforeEach(() => {
    res = mockRes();
    next = vi.fn();
    vi.clearAllMocks();
  });

  // ── getProducts ────────────────────────────────────────────────────────────
  describe('getProducts', () => {
    it('should pass req.query directly to the service', async () => {
      productsService.getProducts.mockResolvedValue({ products: [], total: 0, pages: 0 });

      getProducts(mockReq({ query: { page: '1', search: 'kurta' } }), res, next);
      await flushPromises();

      expect(productsService.getProducts).toHaveBeenCalledWith({ page: '1', search: 'kurta' });
    });

    it('should return the service result as JSON', async () => {
      const result = { products: [{ name: 'Kurta' }], total: 1, pages: 1 };
      productsService.getProducts.mockResolvedValue(result);

      getProducts(mockReq(), res, next);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('should call next with error when service throws', async () => {
      productsService.getProducts.mockRejectedValue(new Error('DB error'));

      getProducts(mockReq(), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── getProductById ─────────────────────────────────────────────────────────
  describe('getProductById', () => {
    it('should pass params.id to the service and return the product', async () => {
      const product = { _id: 'prod-001', name: 'Kurta' };
      productsService.getProductById.mockResolvedValue(product);

      getProductById(mockReq({ params: { id: 'prod-001' } }), res, next);
      await flushPromises();

      expect(productsService.getProductById).toHaveBeenCalledWith('prod-001');
      expect(res.json).toHaveBeenCalledWith(product);
    });

    it('should call next with 404 ApiError when product does not exist', async () => {
      productsService.getProductById.mockRejectedValue(new ApiError(404, 'Product not found'));

      getProductById(mockReq({ params: { id: 'bad-id' } }), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ── createProduct ──────────────────────────────────────────────────────────
  describe('createProduct', () => {
    it('should return 201 with the created product', async () => {
      const created = { _id: 'new-prod', name: 'New Kurta' };
      productsService.createProduct.mockResolvedValue(created);

      createProduct(mockReq({ body: { name: 'New Kurta' }, files: [] }), res, next);
      await flushPromises();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
    });

    it('should pass req.body and req.files to the service', async () => {
      const body = { name: 'Kurta', salesPrice: 200 };
      const files = [{ filename: 'kurta.jpg' }];
      productsService.createProduct.mockResolvedValue({});

      createProduct(mockReq({ body, files }), res, next);
      await flushPromises();

      expect(productsService.createProduct).toHaveBeenCalledWith(body, files);
    });

    it('should call next with error when service throws', async () => {
      productsService.createProduct.mockRejectedValue(new Error('Validation error'));

      createProduct(mockReq(), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── updateProduct ──────────────────────────────────────────────────────────
  describe('updateProduct', () => {
    it('should pass params.id, body, and files to the service', async () => {
      productsService.updateProduct.mockResolvedValue({ _id: 'prod-001', name: 'Updated Kurta' });

      updateProduct(
        mockReq({ params: { id: 'prod-001' }, body: { name: 'Updated Kurta' }, files: [] }),
        res,
        next,
      );
      await flushPromises();

      expect(productsService.updateProduct).toHaveBeenCalledWith('prod-001', { name: 'Updated Kurta' }, []);
    });

    it('should return the updated product as JSON', async () => {
      const updated = { _id: 'prod-001', name: 'Updated' };
      productsService.updateProduct.mockResolvedValue(updated);

      updateProduct(mockReq({ params: { id: 'prod-001' } }), res, next);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('should call next with error when service throws', async () => {
      productsService.updateProduct.mockRejectedValue(new Error('Not found'));

      updateProduct(mockReq({ params: { id: 'bad' } }), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── deleteProduct ──────────────────────────────────────────────────────────
  describe('deleteProduct', () => {
    it('should pass params.id to the service and return success message', async () => {
      productsService.deleteProduct.mockResolvedValue({ message: 'Product removed' });

      deleteProduct(mockReq({ params: { id: 'prod-001' } }), res, next);
      await flushPromises();

      expect(productsService.deleteProduct).toHaveBeenCalledWith('prod-001');
      expect(res.json).toHaveBeenCalledWith({ message: 'Product removed' });
    });

    it('should call next with error when service throws', async () => {
      productsService.deleteProduct.mockRejectedValue(new Error('DB error'));

      deleteProduct(mockReq({ params: { id: 'bad' } }), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
