import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  code: z.string().min(1, 'Verification code is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  code: z.string().min(1, 'Reset code is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// User validation schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
});

export const addressSchema = z.object({
  name: z.string().min(1, 'Address name is required'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().default('Nigeria'),
  isDefault: z.boolean().default(false),
});

// Product validation schemas
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  originalPrice: z.number().positive().optional(),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
  tags: z.array(z.string()).default([]),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().min(1, 'Description is required'),
  image: z.string().url('Invalid image URL'),
  parentId: z.string().optional(),
});

// Cart validation schemas
export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  size: z.string().optional(),
  color: z.string().optional(),
});

export const updateCartSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
});

// Order validation schemas
export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    size: z.string().optional(),
    color: z.string().optional(),
  })).min(1, 'At least one item is required'),
  shippingAddressId: z.string().min(1, 'Shipping address is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

// Shipping validation schemas
export const calculateShippingSchema = z.object({
  state: z.string().min(1, 'State is required'),
  weight: z.number().positive('Weight must be positive'),
});

// Search validation schemas
export const searchProductsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  inStock: z.boolean().optional(),
  sortBy: z.enum(['name', 'price', 'rating', 'newest']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartInput = z.infer<typeof updateCartSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CalculateShippingInput = z.infer<typeof calculateShippingSchema>;
export type SearchProductsInput = z.infer<typeof searchProductsSchema>;