import { ApiError } from '../utils/api-error.js';
import { makeSlug } from '../utils/helpers.js';
import * as collectionRepo from '../repositories/collection.repository.js';
import * as imagekitService from './imagekit.service.js';

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

  if (file) {
    const uploaded   = await imagekitService.uploadCollectionImage(file.buffer, file.originalname);
    data.image       = uploaded.url;
    data.imageFileId = uploaded.fileId;
  }

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

  if (file) {
    const uploaded   = await imagekitService.uploadCollectionImage(file.buffer, file.originalname);
    data.image       = uploaded.url;
    data.imageFileId = uploaded.fileId;

    // Delete old image from ImageKit (fire-and-forget)
    const existing = await collectionRepo.findById(id);
    if (existing?.imageFileId) {
      imagekitService.deleteFile(existing.imageFileId).catch(() => {});
    }
  }

  const collection = await collectionRepo.update(id, data);
  if (!collection) throw new ApiError(404, 'Collection not found');
  return collection;
}

export async function deleteCollection(id) {
  const col = await collectionRepo.findById(id);
  if (!col) throw new ApiError(404, 'Collection not found');
  if (col.isSystem) throw new ApiError(403, 'System collections cannot be deleted');

  if (col.imageFileId) {
    imagekitService.deleteFile(col.imageFileId).catch(() => {});
  }

  await collectionRepo.softDelete(id);
  return { message: 'Collection removed' };
}
