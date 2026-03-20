import Product from '../models/Product.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { parseCollections } from '../utils/helpers.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, search, collection } = req.query;
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
    Product.find(filter)
      .populate('collections', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ products, total, pages: Math.ceil(total / limit), page: parseInt(page) });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('collections', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  data.collections = parseCollections(req.body);
  delete data.collection;

  if (req.files?.length) {
    data.images = req.files.map(f => `/uploads/products/${f.filename}`);
  }
  const product = new Product(data);
  await product.save();
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  data.collections = parseCollections(req.body);
  delete data.collection;

  if (req.files?.length) {
    data.images = req.files.map(f => `/uploads/products/${f.filename}`);
  }
  const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: 'Product removed' });
});
