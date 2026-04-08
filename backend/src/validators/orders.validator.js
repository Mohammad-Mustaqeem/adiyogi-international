import { z } from 'zod';

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Customer name is required'),
    phone: z.union([z.string(), z.literal('')]).optional().default(''),
    whatsapp: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().min(1, 'Pincode is required'),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, 'At least one item is required'),
  paymentMode: z.enum(['Credit', 'Cash', 'Online', 'UPI']).optional(),
});
