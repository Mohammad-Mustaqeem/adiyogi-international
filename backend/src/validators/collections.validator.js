import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').transform((v) => v.trim()),
  description: z.string().optional(),
  sortOrder: z.coerce.number().optional(),
});

export const updateCollectionSchema = z.object({
  name: z.string().min(1).transform((v) => v.trim()).optional(),
  description: z.string().optional(),
  sortOrder: z.coerce.number().optional(),
});
