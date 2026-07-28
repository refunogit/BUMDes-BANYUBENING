import { Router } from 'express';
import multer from 'multer';
import { pengurusController } from './pengurus.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createSchema, updateSchema } from './pengurus.validation';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.get('/', pengurusController.list);

router.get('/:id', pengurusController.getById);

router.post('/', authenticate, upload.single('image'), validate(createSchema), pengurusController.create);
router.put('/:id', authenticate, upload.single('image'), validate(updateSchema), pengurusController.update);
router.delete('/:id', authenticate, pengurusController.delete);

export default router;
