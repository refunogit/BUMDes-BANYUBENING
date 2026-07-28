import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'STAFF']).optional(),
});

export const updatePinSchema = z.object({
  oldPin: z.string().min(4),
  newPin: z.string().min(4).max(20),
});

export const verifyPinSchema = z.object({
  pin: z.string().min(4),
});
