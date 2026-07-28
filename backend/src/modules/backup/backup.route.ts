import { Router } from 'express';
import { backupController } from './backup.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, authorize('SUPER_ADMIN', 'ADMIN'));

router.get('/', backupController.list);
router.post('/', backupController.create);
router.post('/restore', backupController.restore);
router.delete('/cleanup', backupController.cleanup);

export default router;
