import { z } from 'zod';

export const createCoaSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(2).max(100),
  type: z.enum(['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE']),
  normalBalance: z.enum(['DEBIT','CREDIT']).optional(),
  parentId: z.string().optional(),
  description: z.string().optional(),
  isActive: z.union([z.boolean(), z.string()]).optional(),
});

export const updateCoaSchema = createCoaSchema.partial();
