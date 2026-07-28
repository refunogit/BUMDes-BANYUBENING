import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validation.middleware';
import { loginSchema, refreshSchema, createUserSchema, updatePinSchema, verifyPinSchema } from './auth.validation';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/verify-pin', validate(verifyPinSchema), authController.verifyPin);

router.get('/me', authenticate, authController.me);
router.put('/pin', authenticate, validate(updatePinSchema), authController.updatePin);

router.get('/users', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), authController.getAllUsers);
router.post('/users', authenticate, authorize('SUPER_ADMIN'), validate(createUserSchema), authController.createUser);

export default router;
