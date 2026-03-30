import express from 'express';
import auth from '../middleware/auth.middleware.js';
import { uploadProductImages } from '../middleware/multer.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createProductSchema, updateProductSchema } from '../validators/products.validator.js';
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
router.post('/', auth, uploadProductImages, validate(createProductSchema), createProduct);
router.put('/:id', auth, uploadProductImages, validate(updateProductSchema), updateProduct);
router.delete('/:id', auth, deleteProduct);

export default router;
