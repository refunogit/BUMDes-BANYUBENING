import { z } from 'zod';

export const updateIdentitySchema = z.object({
  name: z.string().min(2).optional(),
  shortName: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  villageName: z.string().optional(),
  district: z.string().optional(),
  regency: z.string().optional(),
  province: z.string().optional(),
});
