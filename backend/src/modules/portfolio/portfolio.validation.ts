import { z } from 'zod';


export const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().optional(),
  clientName: z.string().optional(),
  linkUrl: z.string().optional(),
  isPublished: z.union([z.boolean(), z.string()]).optional(),
});
export const updateSchema = createSchema.partial();
