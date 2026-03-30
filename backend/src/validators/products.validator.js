import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  itemCode: z.string().min(1, 'Item code is required'),
  salesPrice: z.coerce.number().positive('Sales price must be positive'),
  description: z.string().optional(),
  hsnCode: z.string().optional(),
  purchasePrice: z.coerce.number().optional(),
  baseUnit: z.enum(['PAC', 'NOS']).optional(),
  secondaryUnit: z.enum(['NOS', 'None']).optional(),
  unitConversionRate: z.coerce.number().optional(),
  stock: z.coerce.number().optional(),
  place: z.string().optional(),
  gstRate: z.coerce.number().optional(),
  collections: z.any().optional(),
  collection: z.any().optional(),
});

export const updateProductSchema = createProductSchema.partial();
