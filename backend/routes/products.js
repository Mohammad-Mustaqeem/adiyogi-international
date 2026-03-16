import express from 'express';
import { join, dirname, extname } from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = join(__dirname, '..', 'uploads', 'products');
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// PUBLIC: Get all products
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, search, collection } = req.query;
    const filter = { isActive: true };

    // Support both old single collection and new multi-collection
    if (collection && collection !== 'all') {
      filter.collections = collection; // $in match for array field
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC: Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('collections', 'name slug');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Parse collections from form data (can come as JSON array string or multiple fields)
function parseCollections(body) {
  const raw = body.collections;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  try { return JSON.parse(raw).filter(Boolean); } catch { return [raw].filter(Boolean); }
}

// ADMIN: Create product
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    data.collections = parseCollections(req.body);
    delete data.collection; // remove old single field if sent

    if (req.files?.length) {
      data.images = req.files.map(f => `/uploads/products/${f.filename}`);
    }
    const product = new Product(data);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: Update product
router.put('/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    data.collections = parseCollections(req.body);
    delete data.collection;

    if (req.files?.length) {
      data.images = req.files.map(f => `/uploads/products/${f.filename}`);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
