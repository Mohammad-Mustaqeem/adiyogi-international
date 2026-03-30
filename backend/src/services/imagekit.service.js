import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import imagekit from '../config/imagekit.config.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Upload a single product image buffer to ImageKit.
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @returns {Promise<{ url: string, fileId: string }>}
 */
export async function uploadProductImage(fileBuffer, originalName) {
  const ext      = extname(originalName) || '.jpg';
  const fileName = `product-${uuidv4()}${ext}`;

  const response = await imagekit.upload({
    file:              fileBuffer,
    fileName,
    folder:            env.IMAGEKIT_PRODUCT_IMAGES_FOLDER,
    useUniqueFileName: false,
    tags:              ['product'],
  });

  return { url: response.url, fileId: response.fileId };
}

/**
 * Upload multiple product image buffers to ImageKit.
 * @param {Array<{ buffer: Buffer, originalname: string }>} files  multer file objects
 * @returns {Promise<Array<{ url: string, fileId: string }>>}
 */
export async function uploadProductImages(files) {
  return Promise.all(files.map((f) => uploadProductImage(f.buffer, f.originalname)));
}

/**
 * Upload a single collection image buffer to ImageKit.
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @returns {Promise<{ url: string, fileId: string }>}
 */
export async function uploadCollectionImage(fileBuffer, originalName) {
  const ext      = extname(originalName) || '.jpg';
  const fileName = `collection-${uuidv4()}${ext}`;

  const response = await imagekit.upload({
    file:              fileBuffer,
    fileName,
    folder:            env.IMAGEKIT_COLLECTION_IMAGES_FOLDER,
    useUniqueFileName: false,
    tags:              ['collection'],
  });

  return { url: response.url, fileId: response.fileId };
}

/**
 * Upload an invoice PDF buffer to ImageKit.
 * @param {Buffer} pdfBuffer
 * @param {string} orderId  used as the readable filename base
 * @returns {Promise<{ url: string, fileId: string }>}
 */
export async function uploadInvoicePdf(pdfBuffer, orderId) {
  const fileName = `invoice-${orderId}-${uuidv4()}.pdf`;

  const response = await imagekit.upload({
    file:              pdfBuffer,
    fileName,
    folder:            env.IMAGEKIT_INVOICES_FOLDER,
    useUniqueFileName: false,
    tags:              ['invoice'],
  });

  return { url: response.url, fileId: response.fileId };
}

/**
 * Delete a file from ImageKit by fileId.
 * @param {string} fileId
 */
export async function deleteFile(fileId) {
  if (!fileId) return;
  try {
    await imagekit.deleteFile(fileId);
  } catch (err) {
    logger.warn({ err, fileId }, '[imagekit] deleteFile failed — continuing');
  }
}

/**
 * Delete multiple files by fileId array. Errors are logged but do not throw.
 * @param {string[]} fileIds
 */
export async function deleteFiles(fileIds = []) {
  await Promise.all(fileIds.filter(Boolean).map(deleteFile));
}
