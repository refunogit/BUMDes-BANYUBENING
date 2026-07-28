import { z } from 'zod';


export const createSchema = z.object({
  text: z.string().min(3),
  emoji: z.string().optional(),
  isActive: z.union([z.boolean(), z.string()]).optional(),
  order: z.union([z.number(), z.string()]).optional(),
  speed: z.union([z.number(), z.string()]).optional(),
});
export const updateSchema = createSchema.partial();
