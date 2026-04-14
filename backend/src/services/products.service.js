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

  // Parse which existing CDN fileIds should be removed
  let removeFileIds = [];
  if (body.removeImageIds) {
    try {
      removeFileIds = JSON.parse(body.removeImageIds);
    } catch { removeFileIds = []; }
  }

  // Parse the ordered list of kept existing image URLs sent from the frontend
  let keptImageUrls = [];
  if (body.keptImageUrls) {
    try {
      keptImageUrls = JSON.parse(body.keptImageUrls);
    } catch { keptImageUrls = []; }
  }

  // Fetch current product to get existing image arrays
  const existing = await productRepo.findById(id);
  if (!existing) throw new ApiError(404, 'Product not found');

  const existingUrls    = existing.images       ?? [];
  const existingFileIds = existing.imageFileIds  ?? [];

  // Build a url→fileId map for lookup
  const urlToFileId = {};
  existingUrls.forEach((url, i) => { urlToFileId[url] = existingFileIds[i] ?? null; });

  // Determine kept existing images in the order specified by frontend
  // If frontend sent keptImageUrls, use that order; otherwise keep all non-removed ones
  let keptUrls, keptFileIds;
  if (keptImageUrls.length > 0) {
    keptUrls    = keptImageUrls;
    keptFileIds = keptImageUrls.map((url) => urlToFileId[url] ?? null);
  } else {
    // Fall back: keep everything not in removeFileIds
    const removedSet = new Set(removeFileIds);
    keptUrls    = [];
    keptFileIds = [];
    existingUrls.forEach((url, i) => {
      const fid = existingFileIds[i] ?? null;
      if (!removedSet.has(fid)) {
        keptUrls.push(url);
        keptFileIds.push(fid);
      }
    });
  }

  // Upload new images and append after the kept ones
  let newUrls = [], newFileIds = [];
  if (files?.length) {
    const uploaded = await imagekitService.uploadProductImages(files);
    newUrls    = uploaded.map((u) => u.url);
    newFileIds = uploaded.map((u) => u.fileId);
  }

  // Delete only the explicitly removed files from ImageKit (fire-and-forget)
  if (removeFileIds.length) {
    imagekitService.deleteFiles(removeFileIds.filter(Boolean)).catch(() => {});
  }

  data.images       = [...keptUrls,    ...newUrls];
  data.imageFileIds = [...keptFileIds, ...newFileIds];

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
