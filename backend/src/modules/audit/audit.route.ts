import { Router } from 'express';
import { auditController } from './audit.controller';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';

const router = Router();

router.get('/', verifyToken, requireAdmin, (req, res) => auditController.getLogs(req, res));

export const auditRouter = router;
