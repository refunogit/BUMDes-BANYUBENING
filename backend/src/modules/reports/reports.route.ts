import { Router } from 'express';
import { reportsController } from './reports.controller';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';

const router = Router();

router.get('/financial/excel', verifyToken, requireAdmin, (req, res) =>
  reportsController.getFinancialExcel(req, res)
);
router.get('/program-kerja/excel', verifyToken, requireAdmin, (req, res) =>
  reportsController.getProgramKerjaExcel(req, res)
);
router.get('/pengaduan/excel', verifyToken, requireAdmin, (req, res) =>
  reportsController.getPengaduanExcel(req, res)
);
router.get('/audit/excel', verifyToken, requireAdmin, (req, res) =>
  reportsController.getAuditExcel(req, res)
);

export const reportsRouter = router;
