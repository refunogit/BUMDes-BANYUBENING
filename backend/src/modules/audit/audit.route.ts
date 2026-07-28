import { Router } from 'express';
import { auditController } from './audit.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate, authorize('SUPER_ADMIN','ADMIN'));
router.get('/', auditController.list);
export default router;
