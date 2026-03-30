import { asyncHandler } from '../utils/async-handler.js';
import * as productsService from '../services/products.service.js';

export const getProducts = asyncHandler(async (req, res) => {
  const result = await productsService.getProducts(req.query);
  res.json(result);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await productsService.getProductById(req.params.id);
  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productsService.createProduct(req.body, req.files);
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productsService.updateProduct(req.params.id, req.body, req.files);
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productsService.deleteProduct(req.params.id);
  res.json(result);
});
