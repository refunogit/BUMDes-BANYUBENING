import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10),
  shortDesc: z.string().optional(),
  price: z.union([z.number(), z.string()]),
  discountPrice: z.union([z.number(), z.string()]).optional(),
  stock: z.union([z.number(), z.string()]).optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  weight: z.union([z.number(), z.string()]).optional(),
  isActive: z.union([z.boolean(), z.string()]).optional(),
  isFeatured: z.union([z.boolean(), z.string()]).optional(),
});

export const updateProductSchema = createProductSchema.partial();
