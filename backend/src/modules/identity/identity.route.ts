import { Router } from 'express';
import multer from 'multer';
import { identityController } from './identity.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { updateIdentitySchema } from './identity.validation';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.get('/', identityController.get);
router.put(
  '/',
  authenticate,
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]),
  validate(updateIdentitySchema),
  identityController.update
);

export default router;
