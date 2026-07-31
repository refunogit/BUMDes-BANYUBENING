import { Router } from 'express';
import { z } from 'zod';
import { pengurusController } from './pengurus.controller';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';

const router = Router();

const createPengurusSchema = z.object({
  name: z.string().min(1, 'Nama pengurus wajib diisi'),
  role: z.string().min(1, 'Jabatan/role wajib diisi'),
  photoUrl: z.string().min(1, 'Foto profil wajib diisi'),
  bio: z.string().optional(),
  orderIndex: z.number().optional(),
  isActive: z.boolean().optional(),
});

router.get('/', (req, res) => pengurusController.getList(req, res));
router.post('/', verifyToken, requireAdmin, validateBody(createPengurusSchema), (req, res) =>
  pengurusController.create(req, res)
);
router.put('/:id', verifyToken, requireAdmin, (req, res) => pengurusController.update(req, res));
router.delete('/:id', verifyToken, requireAdmin, (req, res) => pengurusController.delete(req, res));

export const pengurusRouter = router;
