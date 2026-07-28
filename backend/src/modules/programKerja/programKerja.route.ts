import { Router } from 'express';
import multer from 'multer';
import { programKerjaController } from './programKerja.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createSchema, updateSchema } from './programKerja.validation';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.get('/', programKerjaController.list);
router.get('/slug/:slug', programKerjaController.getBySlug);
router.get('/:id', programKerjaController.getById);

router.post('/', authenticate, upload.single('image'), validate(createSchema), programKerjaController.create);
router.put('/:id', authenticate, upload.single('image'), validate(updateSchema), programKerjaController.update);
router.delete('/:id', authenticate, programKerjaController.delete);

export default router;
