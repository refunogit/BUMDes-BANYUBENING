import { z } from 'zod';

export const configSchema = z.object({
  phoneNumber: z.string().min(8),
  apiKey: z.string().optional(),
  apiUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const sendMessageSchema = z.object({
  to: z.string().min(8),
  message: z.string().min(1),
});

export const bulkMessageSchema = z.object({
  to: z.array(z.string()).min(1),
  message: z.string().min(1),
});
