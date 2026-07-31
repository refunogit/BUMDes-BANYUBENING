import { Request, Response } from 'express';
import { pengurusService } from './pengurus.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class PengurusController {
  async getList(req: Request, res: Response) {
    try {
      const list = await pengurusService.getPengurusList();
      return res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const created = await pengurusService.createPengurus(req.body, performedBy);
      return res.status(201).json({ success: true, data: created, message: 'Data pengurus berhasil ditambahkan.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      const updated = await pengurusService.updatePengurus(id, req.body, performedBy);
      return res.status(200).json({ success: true, data: updated, message: 'Data pengurus berhasil diperbarui.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      await pengurusService.deletePengurus(id, performedBy);
      return res.status(200).json({ success: true, message: 'Data pengurus berhasil dihapus.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const pengurusController = new PengurusController();
