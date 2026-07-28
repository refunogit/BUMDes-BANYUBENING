import { Router } from 'express';
import multer from 'multer';
import { portfolioController } from './portfolio.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createSchema, updateSchema } from './portfolio.validation';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.get('/', portfolioController.list);
router.get('/slug/:slug', portfolioController.getBySlug);
router.get('/:id', portfolioController.getById);

router.post('/', authenticate, upload.single('image'), validate(createSchema), portfolioController.create);
router.put('/:id', authenticate, upload.single('image'), validate(updateSchema), portfolioController.update);
router.delete('/:id', authenticate, portfolioController.delete);

export default router;
