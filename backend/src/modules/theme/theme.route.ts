import { Router } from 'express';
import multer from 'multer';
import { themeConfigController } from './theme.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createSchema, updateSchema } from './theme.validation';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.get('/', themeConfigController.list);

router.get('/:id', themeConfigController.getById);

router.post('/', authenticate,  validate(createSchema), themeConfigController.create);
router.put('/:id', authenticate,  validate(updateSchema), themeConfigController.update);
router.delete('/:id', authenticate, themeConfigController.delete);

export default router;
