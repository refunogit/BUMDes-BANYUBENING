import { z } from 'zod';


export const createSchema = z.object({
  name: z.string().min(2),
  role: z.enum(['DIREKTUR','SEKRETARIS_1','SEKRETARIS_2','BENDAHARA','MANAGER_JASA','MANAGER_PRODUKSI','MANAGER_PERDAGANGAN','STAFF']),
  roleLabel: z.string().min(2),
  bio: z.string().optional(),
  order: z.union([z.number(), z.string()]).optional(),
  isActive: z.union([z.boolean(), z.string()]).optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});
export const updateSchema = createSchema.partial();
