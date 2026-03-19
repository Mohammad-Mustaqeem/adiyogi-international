import express from 'express';
import { join, dirname, extname } from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import Collection from '../models/Collection.js';
import auth from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = join(__dirname, '..', 'uploads', 'collections');
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function makeSlug(name) {
  const base = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${base}-${Date.now()}`;
}

// PUBLIC: Get all collections
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json(collections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Create collection
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.body.name?.trim()) return res.status(400).json({ message: 'Collection name is required' });
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
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: Update collection
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const data = {};
    if (req.body.name) { data.name = req.body.name.trim(); data.slug = makeSlug(req.body.name.trim()); }
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.sortOrder !== undefined) data.sortOrder = req.body.sortOrder;
    if (req.file) data.image = `/uploads/collections/${req.file.filename}`;
    const collection = await Collection.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    res.json(collection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: Delete collection
router.delete('/:id', auth, async (req, res) => {
  try {
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ message: 'Collection not found' });
    if (col.isSystem) return res.status(403).json({ message: 'System collections cannot be deleted' });
    await Collection.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Collection removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
