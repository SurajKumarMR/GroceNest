
import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phone: z.string().regex(/^\+44[0-9]{10}$/, 'Invalid UK phone number format (+44xxxxxxxxxx)').optional(),
    role: z.enum(['CUSTOMER', 'MERCHANT', 'DRIVER']).optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const updateProfileSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    phone: z.string().optional(),
    dietaryPreferences: z.array(z.string()).optional(),
    cuisinePreferences: z.array(z.string()).optional(),
});

export const storeSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    slug: z.string().min(2),
    streetAddress: z.string(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string().regex(/^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}$/i, 'Invalid UK Postcode format (e.g. B10 1AA)'),
    country: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    cuisineTypes: z.array(z.string()),
    specialtyTags: z.array(z.string()).optional(),
});

export const productSchema = z.object({
    storeId: z.string().uuid(),
    categoryId: z.string().uuid().optional(),
    name: z.string().min(2),
    slug: z.string().min(2),
    description: z.string().optional(),
    regularPrice: z.number().positive(),
    salePrice: z.number().positive().optional(),
    stockQuantity: z.number().int().nonnegative(),
    unit: z.string().optional(),
});

export const cartItemSchema = z.object({
    productId: z.string().uuid(),
    productVariantId: z.string().uuid().optional(),
    quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
    deliveryAddressId: z.string().uuid(),
    deliveryInstructions: z.string().optional(),
    paymentMethod: z.enum(['CARD', 'CASH', 'APPLE_PAY', 'GOOGLE_PAY', 'PAYPAL']),
    tipAmount: z.number().nonnegative().optional(),
});

export const addressSchema = z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().regex(/^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}$/i, 'Invalid UK Postcode format'),
    country: z.string().min(1),
    isDefault: z.boolean().optional(),
});
