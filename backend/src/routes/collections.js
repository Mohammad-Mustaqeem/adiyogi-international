import express from 'express';
import auth from '../middleware/auth.js';
import { uploadCollectionImage } from '../middleware/multer.js';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../controllers/collections.controller.js';

const router = express.Router();

router.get('/', getCollections);
router.post('/', auth, uploadCollectionImage.single('image'), createCollection);
router.put('/:id', auth, uploadCollectionImage.single('image'), updateCollection);
router.delete('/:id', auth, deleteCollection);

export default router;
