import { ApiError } from '../utils/api-error.js';
import { makeSlug } from '../utils/helpers.js';
import * as collectionRepo from '../repositories/collection.repository.js';

export async function getCollections() {
  return collectionRepo.findActive();
}

export async function createCollection(body, file) {
  const data = {
    name: body.name.trim(),
    description: body.description || '',
    sortOrder: body.sortOrder || 0,
    slug: makeSlug(body.name.trim()),
  };
  if (file) data.image = `/uploads/collections/${file.filename}`;
  return collectionRepo.create(data);
}

export async function updateCollection(id, body, file) {
  const data = {};
  if (body.name) {
    data.name = body.name.trim();
    data.slug = makeSlug(body.name.trim());
  }
  if (body.description !== undefined) data.description = body.description;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
  if (file) data.image = `/uploads/collections/${file.filename}`;

  const collection = await collectionRepo.update(id, data);
  if (!collection) throw new ApiError(404, 'Collection not found');
  return collection;
}

export async function deleteCollection(id) {
  const col = await collectionRepo.findById(id);
  if (!col) throw new ApiError(404, 'Collection not found');
  if (col.isSystem) throw new ApiError(403, 'System collections cannot be deleted');
  await collectionRepo.softDelete(id);
  return { message: 'Collection removed' };
}
