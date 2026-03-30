import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const setupSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  whatsappNumber: z.string().min(1, 'WhatsApp number is required'),
  name: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']),
});
