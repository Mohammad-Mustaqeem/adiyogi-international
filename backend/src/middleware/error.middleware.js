import { ApiError } from '../utils/api-error.js';
import { logger } from '../config/logger.js';

const errorHandler = (err, _req, res, _next) => {
  logger.error({ err });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Mongoose validation error or Zod validation error
  if (err.name === 'ValidationError') {
    return res.status(err.statusCode || 400).json({ message: err.message });
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

  // ImageKit CDN errors
  if (err.message && (err.message.toLowerCase().includes('imagekit') || err.message.includes('ik.imagekit'))) {
    return res.status(502).json({
      message: 'CDN service error. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
    });
  }

  res.status(500).json({ message: err.message });
};

export default errorHandler;
