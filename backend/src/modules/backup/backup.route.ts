import { Router } from 'express';
import { z } from 'zod';
import { backupController } from './backup.controller';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';

const router = Router();

const restoreSchema = z.object({
  backupId: z.string().min(1, 'ID backup wajib diisi'),
});

router.get('/history', verifyToken, requireAdmin, (req, res) => backupController.getHistory(req, res));
router.post('/manual', verifyToken, requireAdmin, (req, res) => backupController.triggerManualBackup(req, res));
router.post('/restore', verifyToken, requireAdmin, validateBody(restoreSchema), (req, res) =>
  backupController.restoreBackup(req, res)
);
router.get('/download/:filename', verifyToken, requireAdmin, (req, res) =>
  backupController.downloadBackup(req, res)
);

export const backupRouter = router;
