import { ApiError } from '../utils/api-error.js';

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large (max 10MB)' });
  }
  if (err.message === 'Only image files allowed') {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: err.message });
};

export default errorHandler;
