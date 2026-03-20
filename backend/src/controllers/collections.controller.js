import Collection from '../models/Collection.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { makeSlug } from '../utils/helpers.js';

export const getCollections = asyncHandler(async (req, res) => {
  const collections = await Collection.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json(collections);
});

export const createCollection = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) throw new ApiError(400, 'Collection name is required');
  const data = {
    name: req.body.name.trim(),
    description: req.body.description || '',
    sortOrder: req.body.sortOrder || 0,
    slug: makeSlug(req.body.name.trim()),
  };
  if (req.file) data.image = `/uploads/collections/${req.file.filename}`;
  const collection = new Collection(data);
  await collection.save();
  res.status(201).json(collection);
});

export const updateCollection = asyncHandler(async (req, res) => {
  const data = {};
  if (req.body.name) { data.name = req.body.name.trim(); data.slug = makeSlug(req.body.name.trim()); }
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.sortOrder !== undefined) data.sortOrder = req.body.sortOrder;
  if (req.file) data.image = `/uploads/collections/${req.file.filename}`;
  const collection = await Collection.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!collection) throw new ApiError(404, 'Collection not found');
  res.json(collection);
});

export const deleteCollection = asyncHandler(async (req, res) => {
  const col = await Collection.findById(req.params.id);
  if (!col) throw new ApiError(404, 'Collection not found');
  if (col.isSystem) throw new ApiError(403, 'System collections cannot be deleted');
  await Collection.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: 'Collection removed' });
});
