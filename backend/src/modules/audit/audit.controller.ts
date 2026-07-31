import { Response } from 'express';
import { auditService } from './audit.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class AuditController {
  async getLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const { entity } = req.query;
      const logs = await auditService.getAuditLogs(entity as string);
      return res.status(200).json({ success: true, data: logs });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const auditController = new AuditController();
