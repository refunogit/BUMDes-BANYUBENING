import { Router } from 'express';
import multer from 'multer';
import { runningTextController } from './runningText.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createSchema, updateSchema } from './runningText.validation';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.get('/', runningTextController.list);

router.get('/:id', runningTextController.getById);

router.post('/', authenticate,  validate(createSchema), runningTextController.create);
router.put('/:id', authenticate,  validate(updateSchema), runningTextController.update);
router.delete('/:id', authenticate, runningTextController.delete);

export default router;
