import { Router } from 'express';
import { ledgerController } from './ledger.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', ledgerController.getLedger);
router.get('/:coaId/balance', ledgerController.getCoaBalance);
export default router;
