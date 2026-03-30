import { asyncHandler } from '../utils/async-handler.js';
import * as collectionsService from '../services/collections.service.js';

export const getCollections = asyncHandler(async (req, res) => {
  const collections = await collectionsService.getCollections();
  res.set('Cache-Control', 'public, max-age=60'); // collections change rarely — cache 60s
  res.json(collections);
});

export const createCollection = asyncHandler(async (req, res) => {
  const collection = await collectionsService.createCollection(req.body, req.file);
  res.status(201).json(collection);
});

export const updateCollection = asyncHandler(async (req, res) => {
  const collection = await collectionsService.updateCollection(req.params.id, req.body, req.file);
  res.json(collection);
});

export const deleteCollection = asyncHandler(async (req, res) => {
  const result = await collectionsService.deleteCollection(req.params.id);
  res.json(result);
});
