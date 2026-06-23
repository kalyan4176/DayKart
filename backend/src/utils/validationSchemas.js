import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    role: z.enum(['customer', 'seller', 'delivery_partner']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  }),
});

export const otpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  }),
});

export const addressSchema = z.object({
  body: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    isDefault: z.boolean().optional(),
  }),
});

export const sellerProfileSchema = z.object({
  body: z.object({
    storeName: z.string().min(2, 'Store name must be at least 2 characters'),
    storeDescription: z.string().optional(),
    gstin: z.string().min(15, 'GSTIN must be 15 characters').max(15, 'GSTIN must be 15 characters'),
    pan: z.string().min(10, 'PAN must be 10 characters').max(10, 'PAN must be 10 characters'),
    bankDetails: z.object({
      accountNumber: z.string().min(1, 'Account number is required'),
      ifsc: z.string().min(1, 'IFSC is required'),
      bankName: z.string().min(1, 'Bank name is required'),
      accountHolderName: z.string().min(1, 'Account holder name is required'),
    }),
    storeAddress: z.object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      country: z.string().min(1, 'Country is required'),
      postalCode: z.string().min(1, 'Postal code is required'),
    }).optional(),
  }),
});

