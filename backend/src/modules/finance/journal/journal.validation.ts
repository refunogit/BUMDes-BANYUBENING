import { z } from 'zod';

const entrySchema = z.object({
  coaId: z.string().min(1),
  debit: z.union([z.number(), z.string()]).optional().default(0),
  credit: z.union([z.number(), z.string()]).optional().default(0),
  description: z.string().optional(),
});

export const createJournalSchema = z.object({
  transactionDate: z.string().optional(),
  description: z.string().min(3),
  reference: z.string().optional(),
  entries: z.array(entrySchema).min(2, 'Minimum 2 entries required (double-entry)'),
});

export const updateJournalSchema = z.object({
  transactionDate: z.string().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  status: z.enum(['DRAFT','POSTED','VOIDED']).optional(),
  entries: z.array(entrySchema).optional(),
});

export const postJournalSchema = z.object({
  status: z.enum(['POSTED','VOIDED','DRAFT']),
});
