import { Router } from 'express';
import { reportController } from './report.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();

router.get('/public/summary', reportController.publicSummary);

router.use(authenticate);
router.get('/laba-rugi', reportController.labaRugi);
router.get('/neraca', reportController.neraca);
router.get('/arus-kas', reportController.arusKas);
router.get('/perubahan-modal', reportController.perubahanModal);

export default router;
