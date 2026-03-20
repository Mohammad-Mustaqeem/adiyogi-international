import multer from 'multer';
import { join, dirname, extname } from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createStorage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = join(__dirname, '..', 'uploads', subfolder);
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + extname(file.originalname));
    },
  });
}

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'));
};

const limits = { fileSize: 10 * 1024 * 1024 };

export const uploadProductImages = multer({ storage: createStorage('products'), limits, fileFilter: imageFilter });
export const uploadCollectionImage = multer({ storage: createStorage('collections'), limits, fileFilter: imageFilter });
