import { z } from 'zod'

const indianPhone = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')

const pincode = z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode')

// ── Checkout form ───────────────────────────────────────────────
export const checkoutSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your full name'),
  whatsapp: indianPhone.describe('WhatsApp number is required for invoice delivery'),
  email: z.union([z.literal(''), z.string().email('Enter a valid email')]),
  address: z.string().trim().min(1, 'Please enter your delivery address'),
  city: z.string().trim().min(1, 'Please enter your city'),
  state: z.string().min(1, 'Please select your state'),
  pincode,
})

// ── Admin login ─────────────────────────────────────────────────
export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

// ── Admin first-time setup ──────────────────────────────────────
export const adminSetupSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().trim().min(1, 'Name is required'),
  whatsappNumber: indianPhone,
})

// ── Product form ────────────────────────────────────────────────
export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  itemCode: z.string().trim().min(1, 'Item code is required'),
  hsnCode: z.string().optional(),
  salesPrice: z.coerce.number().positive('Sales price must be positive'),
  purchasePrice: z.union([z.literal(''), z.coerce.number().positive('Purchase price must be positive')]).optional(),
  standardPacking: z.string().optional(),
  baseUnit: z.string().default('PAC'),
  secondaryUnit: z.string().default('NOS'),
  unitConversionRate: z.coerce.number().positive().default(10),
  collections: z.array(z.string()).default([]),
  place: z.string().optional(),
  description: z.string().optional(),
})

// ── Collection form ──────────────────────────────────────────────
export const collectionSchema = z.object({
  name: z.string().trim().min(1, 'Collection name is required'),
  description: z.string().optional(),
})

// ── Admin profile update ─────────────────────────────────────────
export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  username: z.string().trim().min(3, 'Username must be at least 3 characters'),
  whatsappNumber: z.string({
    required_error: 'WhatsApp number is required',
    invalid_type_error: 'Please enter a valid number',
  }),
})

// ── Admin change password ────────────────────────────────────────
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ── Helper: validate and return first error or null ──────────────
export function validate(schema, data) {
  const result = schema.safeParse(data)
  if (result.success) return null
  return result.error.issues[0].message
}

// ── Helper: validate and return per-field error map ─────────────
export function validateFields(schema, data) {
  const result = schema.safeParse(data)
  if (result.success) return {}
  const errors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (field && !errors[field]) errors[field] = issue.message
  }
  return errors
}
