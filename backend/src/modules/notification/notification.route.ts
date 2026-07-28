import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/public', notificationController.publicList);

router.use(authenticate);
router.get('/', notificationController.list);
router.post('/', notificationController.create);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.delete);

export default router;
