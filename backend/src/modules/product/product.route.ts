import { Router } from 'express';
import multer from 'multer';
import { productController } from './product.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createProductSchema, updateProductSchema } from './product.validation';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.get('/public', productController.publicList);
router.get('/categories', productController.categories);
router.get('/featured', productController.featured);
router.get('/slug/:slug', productController.getBySlug);
router.get('/:id', productController.getById);
router.get('/', productController.list);

router.post('/', authenticate, upload.array('images', 10), validate(createProductSchema), productController.create);
router.put('/:id', authenticate, upload.array('images', 10), validate(updateProductSchema), productController.update);
router.delete('/:id', authenticate, productController.delete);

export default router;
