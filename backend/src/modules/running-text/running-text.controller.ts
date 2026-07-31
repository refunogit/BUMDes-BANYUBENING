import { Request, Response } from 'express';
import { runningTextService } from './running-text.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class RunningTextController {
  async getList(req: Request, res: Response) {
    try {
      const list = await runningTextService.getRunningTexts();
      return res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const created = await runningTextService.createRunningText(req.body, performedBy);
      return res.status(201).json({ success: true, data: created, message: 'Teks berjalan berhasil ditambahkan.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      const updated = await runningTextService.updateRunningText(id, req.body, performedBy);
      return res.status(200).json({ success: true, data: updated, message: 'Teks berjalan berhasil diperbarui.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      await runningTextService.deleteRunningText(id, performedBy);
      return res.status(200).json({ success: true, message: 'Teks berjalan berhasil dihapus.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const runningTextController = new RunningTextController();
