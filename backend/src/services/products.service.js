import { ApiError } from '../utils/api-error.js';
import { parseCollections } from '../utils/helpers.js';
import * as productRepo from '../repositories/product.repository.js';

export async function getProducts({ page = 1, limit = 12, search, collection } = {}) {
  const filter = { isActive: true };

  if (collection && collection !== 'all') {
    filter.collections = collection;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { itemCode: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
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
    data.images = files.map((f) => `/uploads/products/${f.filename}`);
  }
  return productRepo.create(data);
}

export async function updateProduct(id, body, files) {
  const data = { ...body };
  data.collections = parseCollections(body);
  delete data.collection;

  if (files?.length) {
    data.images = files.map((f) => `/uploads/products/${f.filename}`);
  }
  return productRepo.update(id, data);
}

export async function deleteProduct(id) {
  await productRepo.softDelete(id);
  return { message: 'Product removed' };
}
