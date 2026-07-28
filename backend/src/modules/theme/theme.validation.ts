import { z } from 'zod';


export const createSchema = z.object({
  type: z.enum(['DEFAULT','INDEPENDENCE_DAY','CHINESE_NEW_YEAR','RAMADAN_EID']),
  name: z.string().min(2),
  isActive: z.union([z.boolean(), z.string()]).optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export const updateSchema = createSchema.partial();
