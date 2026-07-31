import { Router } from 'express';
import { z } from 'zod';
import { portfolioController } from './portfolio.controller';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';

const router = Router();

const createPortfolioSchema = z.object({
  title: z.string().min(1, 'Judul portofolio wajib diisi'),
  category: z.string().min(1, 'Kategori wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  imageUrl: z.string().min(1, 'URL gambar wajib diisi'),
  date: z.string().min(1, 'Tanggal kegiatan wajib diisi'),
});

router.get('/', (req, res) => portfolioController.getList(req, res));
router.post('/', verifyToken, requireAdmin, validateBody(createPortfolioSchema), (req, res) =>
  portfolioController.create(req, res)
);
router.put('/:id', verifyToken, requireAdmin, (req, res) => portfolioController.update(req, res));
router.delete('/:id', verifyToken, requireAdmin, (req, res) => portfolioController.delete(req, res));

export const portfolioRouter = router;
