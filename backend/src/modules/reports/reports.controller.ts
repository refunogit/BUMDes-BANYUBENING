import { Response } from 'express';
import { reportsService } from './reports.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class ReportsController {
  async getFinancialExcel(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const buffer = await reportsService.generateFinancialExcel(performedBy);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=Laporan_Keuangan_BUMDes_Banyubening.xlsx');
      return res.send(buffer);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProgramKerjaExcel(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const buffer = await reportsService.generateProgramKerjaExcel(performedBy);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=Laporan_Program_Kerja_BUMDes_Banyubening.xlsx');
      return res.send(buffer);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPengaduanExcel(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const buffer = await reportsService.generatePengaduanExcel(performedBy);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=Laporan_Layanan_Pengaduan_BUMDes_Banyubening.xlsx');
      return res.send(buffer);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAuditExcel(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const buffer = await reportsService.generateAuditExcel(performedBy);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=Log_Audit_BUMDes_Banyubening.xlsx');
      return res.send(buffer);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const reportsController = new ReportsController();
