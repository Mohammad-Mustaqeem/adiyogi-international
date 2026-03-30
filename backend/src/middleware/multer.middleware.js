import multer from 'multer';

// All files are buffered in memory — ImageKit receives the buffer directly
const memoryStorage = multer.memoryStorage();

const imageFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'));
};

const limits = { fileSize: 10 * 1024 * 1024 }; // 10 MB

/** Product images — multiple files, field name: "images" */
export const uploadProductImages = multer({
  storage: memoryStorage,
  limits,
  fileFilter: imageFilter,
}).array('images', 10);

/** Collection image — single file, field name: "image" */
export const uploadCollectionImage = multer({
  storage: memoryStorage,
  limits,
  fileFilter: imageFilter,
}).single('image');
