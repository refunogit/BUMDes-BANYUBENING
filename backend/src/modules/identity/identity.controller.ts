import { Request, Response } from 'express';
import { identityService } from './identity.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class IdentityController {
  async getIdentity(req: Request, res: Response) {
    try {
      const identity = await identityService.getIdentity();
      return res.status(200).json({ success: true, data: identity });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateIdentity(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const updated = await identityService.updateIdentity(req.body, performedBy);
      return res.status(200).json({ success: true, data: updated, message: 'Identitas BUMDes berhasil diperbarui.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const identityController = new IdentityController();
