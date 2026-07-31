import { Router } from 'express';
import { z } from 'zod';
import { unitUsahaController } from './unit-usaha.controller';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';

const router = Router();

const createUnitSchema = z.object({
  name: z.string().min(1, 'Nama unit usaha wajib diisi'),
  slug: z.string().optional(),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  coverImage: z.string().min(1, 'Gambar cover wajib diisi'),
  manager: z.string().min(1, 'Nama pengelola wajib diisi'),
  contact: z.string().min(1, 'Kontak wajib diisi'),
  contentBlocks: z.array(
    z.object({
      type: z.enum(['text', 'image']),
      content: z.string().min(1),
    })
  ).optional(),
});

router.get('/', (req, res) => unitUsahaController.getList(req, res));
router.get('/:slug', (req, res) => unitUsahaController.getBySlug(req, res));
router.post('/', verifyToken, requireAdmin, validateBody(createUnitSchema), (req, res) =>
  unitUsahaController.create(req, res)
);
router.put('/:id', verifyToken, requireAdmin, (req, res) => unitUsahaController.update(req, res));
router.delete('/:id', verifyToken, requireAdmin, (req, res) => unitUsahaController.delete(req, res));

export const unitUsahaRouter = router;
