import { Router } from 'express';
import multer from 'multer';
import { articleController } from './article.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createArticleSchema, updateArticleSchema } from './article.validation';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.get('/public', articleController.publicList);
router.get('/slug/:slug', articleController.getBySlug);
router.get('/', articleController.list);
router.get('/:id', articleController.getById);

router.post('/', authenticate, upload.single('cover'), validate(createArticleSchema), articleController.create);
router.put('/:id', authenticate, upload.single('cover'), validate(updateArticleSchema), articleController.update);
router.delete('/:id', authenticate, articleController.delete);

export default router;
