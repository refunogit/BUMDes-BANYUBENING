import { Router } from 'express';
import { z } from 'zod';
import { runningTextController } from './running-text.controller';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';

const router = Router();

const createRunningTextSchema = z.object({
  text: z.string().min(1, 'Teks berita wajib diisi'),
  category: z.enum(['FINANCIAL', 'TRAINING', 'BUSINESS', 'GENERAL']),
  isActive: z.boolean().optional(),
  orderIndex: z.number().optional(),
});

router.get('/', (req, res) => runningTextController.getList(req, res));
router.post('/', verifyToken, requireAdmin, validateBody(createRunningTextSchema), (req, res) =>
  runningTextController.create(req, res)
);
router.put('/:id', verifyToken, requireAdmin, (req, res) => runningTextController.update(req, res));
router.delete('/:id', verifyToken, requireAdmin, (req, res) => runningTextController.delete(req, res));

export const runningTextRouter = router;
