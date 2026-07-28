import { z } from 'zod';
export const createCarouselSchema = z.object({
  title: z.string().optional(),
  linkUrl: z.string().optional(),
  order: z.union([z.number(), z.string()]).optional(),
  isActive: z.union([z.boolean(), z.string()]).optional(),
});
export const updateCarouselSchema = createCarouselSchema.partial();
