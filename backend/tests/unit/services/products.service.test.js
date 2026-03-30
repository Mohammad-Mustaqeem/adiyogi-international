/**
 * Unit tests for: ProductsService
 * Module path:    src/services/products.service.js
 * Created:        2026-03-22
 * Updated:        2026-03-24 — CDN ImageKit migration (images stored as CDN URLs + fileIds)
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

vi.mock('../../../src/services/imagekit.service.js', () => ({
  uploadProductImages: vi.fn(),
  deleteFiles:         vi.fn().mockResolvedValue(undefined),
}));

import * as productRepo from '../../../src/repositories/product.repository.js';
import * as helpers from '../../../src/utils/helpers.js';
import * as imagekitService from '../../../src/services/imagekit.service.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../../src/services/products.service.js';

const CDN_BASE = 'https://ik.imagekit.io/test/adiyogi/product-images';

const buildProduct = (overrides = {}) => ({
  _id: 'prod-001',
  name: 'Test Product',
  itemCode: 'TP-001',
  salesPrice: 100,
  isActive: true,
  images: [],
  imageFileIds: [],
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
      expect(imagekitService.uploadProductImages).not.toHaveBeenCalled();
    });

    it('should upload files to ImageKit and store CDN URLs and fileIds when files are provided', async () => {
      const files = [
        { buffer: Buffer.from('img1'), originalname: 'img1.jpg' },
        { buffer: Buffer.from('img2'), originalname: 'img2.jpg' },
      ];
      imagekitService.uploadProductImages.mockResolvedValue([
        { url: `${CDN_BASE}/product-uuid-1.jpg`, fileId: 'fid-1' },
        { url: `${CDN_BASE}/product-uuid-2.jpg`, fileId: 'fid-2' },
      ]);
      productRepo.create.mockResolvedValue(buildProduct());

      await createProduct({ name: 'Product', itemCode: 'P-001', salesPrice: 100 }, files);

      expect(imagekitService.uploadProductImages).toHaveBeenCalledWith(files);
      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          images:       [`${CDN_BASE}/product-uuid-1.jpg`, `${CDN_BASE}/product-uuid-2.jpg`],
          imageFileIds: ['fid-1', 'fid-2'],
        }),
      );
    });

    it('should NOT include images or imageFileIds when files array is empty', async () => {
      productRepo.create.mockResolvedValue(buildProduct());

      await createProduct({ name: 'Product', itemCode: 'P-001', salesPrice: 100 }, []);

      const [data] = productRepo.create.mock.calls[0];
      expect(data.images).toBeUndefined();
      expect(data.imageFileIds).toBeUndefined();
      expect(imagekitService.uploadProductImages).not.toHaveBeenCalled();
    });

    it('should remove the "collection" key from the data before saving', async () => {
      productRepo.create.mockResolvedValue(buildProduct());

      await createProduct({ name: 'P', itemCode: 'P-001', salesPrice: 100, collection: 'col-1' }, null);

      const [data] = productRepo.create.mock.calls[0];
      expect(data.collection).toBeUndefined();
    });

    it('should propagate errors from imagekit.uploadProductImages', async () => {
      imagekitService.uploadProductImages.mockRejectedValue(new Error('CDN error'));
      const files = [{ buffer: Buffer.from('img'), originalname: 'img.jpg' }];

      await expect(
        createProduct({ name: 'P', itemCode: 'P-001', salesPrice: 100 }, files),
      ).rejects.toThrow('CDN error');
    });
  });

  // ── updateProduct ──────────────────────────────────────────────────────────
  describe('updateProduct', () => {
    it('should update the product with parsed collections and no file changes when files are absent', async () => {
      helpers.parseCollections.mockReturnValue(['col-updated']);
      productRepo.update.mockResolvedValue(buildProduct());

      await updateProduct('prod-001', { name: 'Updated' }, null);

      expect(productRepo.update).toHaveBeenCalledWith(
        'prod-001',
        expect.objectContaining({ collections: ['col-updated'] }),
      );
      expect(imagekitService.uploadProductImages).not.toHaveBeenCalled();
    });

    it('should upload new images to ImageKit and update images + imageFileIds when files are provided', async () => {
      const files = [{ buffer: Buffer.from('new-img'), originalname: 'new-img.jpg' }];
      imagekitService.uploadProductImages.mockResolvedValue([
        { url: `${CDN_BASE}/product-new-uuid.jpg`, fileId: 'new-fid' },
      ]);
      productRepo.findById.mockResolvedValue(buildProduct({ imageFileIds: [] }));
      productRepo.update.mockResolvedValue(buildProduct());

      await updateProduct('prod-001', {}, files);

      expect(imagekitService.uploadProductImages).toHaveBeenCalledWith(files);
      expect(productRepo.update).toHaveBeenCalledWith(
        'prod-001',
        expect.objectContaining({
          images:       [`${CDN_BASE}/product-new-uuid.jpg`],
          imageFileIds: ['new-fid'],
        }),
      );
    });

    it('should delete old ImageKit files when replacing images and existing fileIds are present', async () => {
      const files = [{ buffer: Buffer.from('img'), originalname: 'img.jpg' }];
      const OLD_IDS = ['old-fid-1', 'old-fid-2'];
      imagekitService.uploadProductImages.mockResolvedValue([
        { url: `${CDN_BASE}/new.jpg`, fileId: 'new-fid' },
      ]);
      productRepo.findById.mockResolvedValue(buildProduct({ imageFileIds: OLD_IDS }));
      productRepo.update.mockResolvedValue(buildProduct());

      await updateProduct('prod-001', {}, files);

      // Allow fire-and-forget to resolve
      await new Promise((r) => setTimeout(r, 0));

      expect(imagekitService.deleteFiles).toHaveBeenCalledWith(OLD_IDS);
    });

    it('should NOT call deleteFiles when existing product has no imageFileIds', async () => {
      const files = [{ buffer: Buffer.from('img'), originalname: 'img.jpg' }];
      imagekitService.uploadProductImages.mockResolvedValue([
        { url: `${CDN_BASE}/new.jpg`, fileId: 'new-fid' },
      ]);
      productRepo.findById.mockResolvedValue(buildProduct({ imageFileIds: [] }));
      productRepo.update.mockResolvedValue(buildProduct());

      await updateProduct('prod-001', {}, files);
      await new Promise((r) => setTimeout(r, 0));

      expect(imagekitService.deleteFiles).not.toHaveBeenCalled();
    });
  });

  // ── deleteProduct ──────────────────────────────────────────────────────────
  describe('deleteProduct', () => {
    it('should soft delete and return success message', async () => {
      productRepo.findById.mockResolvedValue(buildProduct({ imageFileIds: [] }));
      productRepo.softDelete.mockResolvedValue(undefined);

      const result = await deleteProduct('prod-001');

      expect(productRepo.softDelete).toHaveBeenCalledWith('prod-001');
      expect(result).toEqual({ message: 'Product removed' });
    });

    it('should delete imagekit files before soft deleting when imageFileIds exist', async () => {
      const FILE_IDS = ['fid-a', 'fid-b'];
      productRepo.findById.mockResolvedValue(buildProduct({ imageFileIds: FILE_IDS }));
      productRepo.softDelete.mockResolvedValue(undefined);

      await deleteProduct('prod-001');
      await new Promise((r) => setTimeout(r, 0));

      expect(imagekitService.deleteFiles).toHaveBeenCalledWith(FILE_IDS);
      expect(productRepo.softDelete).toHaveBeenCalledWith('prod-001');
    });

    it('should NOT call deleteFiles when product has no imageFileIds', async () => {
      productRepo.findById.mockResolvedValue(buildProduct({ imageFileIds: [] }));
      productRepo.softDelete.mockResolvedValue(undefined);

      await deleteProduct('prod-001');
      await new Promise((r) => setTimeout(r, 0));

      expect(imagekitService.deleteFiles).not.toHaveBeenCalled();
    });

    it('should propagate errors from the repository', async () => {
      productRepo.findById.mockResolvedValue(buildProduct({ imageFileIds: [] }));
      productRepo.softDelete.mockRejectedValue(new Error('DB error'));

      await expect(deleteProduct('prod-001')).rejects.toThrow('DB error');
    });
  });
});
