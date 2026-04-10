import { ApiError } from '../utils/api-error.js';
import { parseCollections } from '../utils/helpers.js';
import * as productRepo from '../repositories/product.repository.js';
import * as imagekitService from './imagekit.service.js';

export async function getProducts({ page = 1, limit = 12, search, collection } = {}) {
  const filter = { isActive: true };

  if (collection && collection !== 'all') {
    filter.collections = collection;
  }

  if (search) {
    const regex = { $regex: search, $options: 'i' };
    filter.$or = [{ name: regex }, { itemCode: regex }, { description: regex }];
  }

  const [products, total] = await Promise.all([
    productRepo.findProducts(filter, { page, limit }),
    productRepo.countProducts(filter),
  ]);

  return { products, total, pages: Math.ceil(total / limit), page: parseInt(page) };
}

export async function getProductById(id) {
  const product = await productRepo.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

export async function createProduct(body, files) {
  const data = { ...body };
  data.collections = parseCollections(body);
  delete data.collection;

  if (files?.length) {
    const uploaded    = await imagekitService.uploadProductImages(files);
    data.images       = uploaded.map((u) => u.url);
    data.imageFileIds = uploaded.map((u) => u.fileId);
  }

  return productRepo.create(data);
}

export async function updateProduct(id, body, files) {
  const data = { ...body };
  data.collections = parseCollections(body);
  delete data.collection;

  if (files?.length) {
    // Upload new images first
    const uploaded    = await imagekitService.uploadProductImages(files);
    data.images       = uploaded.map((u) => u.url);
    data.imageFileIds = uploaded.map((u) => u.fileId);

    // Delete old images from ImageKit (fire-and-forget)
    const existing = await productRepo.findById(id);
    if (existing?.imageFileIds?.length) {
      imagekitService.deleteFiles(existing.imageFileIds).catch(() => {});
    }
  }

  return productRepo.update(id, data);
}

export async function deleteProduct(id) {
  const product = await productRepo.findById(id);
  if (product?.imageFileIds?.length) {
    imagekitService.deleteFiles(product.imageFileIds).catch(() => {});
  }
  await productRepo.softDelete(id);
  return { message: 'Product removed' };
}
