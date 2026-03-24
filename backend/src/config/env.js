import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('*'),
  SERVER_URL: z.string().default('http://localhost:5000'),
  ADMIN_WHATSAPP: z.string().default(''),
  WHATSAPP_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // ImageKit CDN
  IMAGEKIT_PUBLIC_KEY: z.string().min(1, 'IMAGEKIT_PUBLIC_KEY is required'),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1, 'IMAGEKIT_PRIVATE_KEY is required'),
  IMAGEKIT_URL_ENDPOINT: z.string().url('IMAGEKIT_URL_ENDPOINT must be a valid URL'),
  IMAGEKIT_PRODUCT_IMAGES_FOLDER: z.string().default('adiyogi-internationals/product-images'),
  IMAGEKIT_COLLECTION_IMAGES_FOLDER: z.string().default('adiyogi-internationals/collection-images'),
  IMAGEKIT_INVOICES_FOLDER: z.string().default('adiyogi-internationals/invoices'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
