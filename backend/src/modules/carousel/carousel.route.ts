import { Router } from 'express';
import multer from 'multer';
import { carouselController } from './carousel.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createCarouselSchema, updateCarouselSchema } from './carousel.validation';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.get('/active', carouselController.active);
router.get('/', carouselController.list);
router.get('/:id', carouselController.getById);

router.post('/', authenticate, upload.single('image'), validate(createCarouselSchema), carouselController.create);
router.put('/:id', authenticate, upload.single('image'), validate(updateCarouselSchema), carouselController.update);
router.delete('/:id', authenticate, carouselController.delete);

export default router;
