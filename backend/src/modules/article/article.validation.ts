import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(3).max(200),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  category: z.string().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  isPublished: z.union([z.boolean(), z.string()]).optional(),
  author: z.string().optional(),
});

export const updateArticleSchema = createArticleSchema.partial();
