import { Router } from 'express';
import { z } from 'zod';
import { articlesController } from './articles.controller';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';

const router = Router();

const createArticleSchema = z.object({
  title: z.string().min(1, 'Judul artikel wajib diisi'),
  slug: z.string().optional(),
  summary: z.string().min(1, 'Ringkasan artikel wajib diisi'),
  content: z.string().min(1, 'Konten artikel wajib diisi'),
  coverImage: z.string().min(1, 'Gambar sampul wajib diisi'),
  category: z.string().min(1, 'Kategori wajib diisi'),
  author: z.string().min(1, 'Penulis wajib diisi'),
});

router.get('/', (req, res) => articlesController.getArticles(req, res));
router.get('/:slug', (req, res) => articlesController.getBySlug(req, res));
router.post('/', verifyToken, requireAdmin, validateBody(createArticleSchema), (req, res) =>
  articlesController.create(req, res)
);
router.put('/:id', verifyToken, requireAdmin, (req, res) => articlesController.update(req, res));
router.delete('/:id', verifyToken, requireAdmin, (req, res) => articlesController.delete(req, res));

export const articlesRouter = router;
