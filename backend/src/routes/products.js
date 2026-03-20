import express from 'express';
import auth from '../middleware/auth.js';
import { uploadProductImages } from '../middleware/multer.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/products.controller.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', auth, uploadProductImages.array('images', 5), createProduct);
router.put('/:id', auth, uploadProductImages.array('images', 5), updateProduct);
router.delete('/:id', auth, deleteProduct);

export default router;
