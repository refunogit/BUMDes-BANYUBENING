import { Router } from 'express';
import { z } from 'zod';
import { productsController } from './products.controller';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';

const router = Router();

const createProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  slug: z.string().optional(),
  category: z.string().min(1, 'Kategori produk wajib diisi'),
  price: z.number().min(0, 'Harga wajib >= 0'),
  stock: z.number().int().min(0, 'Stok wajib integer >= 0'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  coverImage: z.string().min(1, 'Gambar utama wajib diisi'),
  galleryImages: z.array(z.string()).optional(),
  unitName: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  soldCount: z.number().int().min(0).optional(),
});

router.get('/', (req, res) => productsController.getProducts(req, res));
router.get('/:slug', (req, res) => productsController.getBySlug(req, res));
router.post('/', verifyToken, requireAdmin, validateBody(createProductSchema), (req, res) =>
  productsController.create(req, res)
);
router.put('/:id', verifyToken, requireAdmin, (req, res) => productsController.update(req, res));
router.delete('/:id', verifyToken, requireAdmin, (req, res) => productsController.delete(req, res));

export const productsRouter = router;
