import { Request, Response } from 'express';
import { unitUsahaService } from './unit-usaha.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class UnitUsahaController {
  async getList(req: Request, res: Response) {
    try {
      const list = await unitUsahaService.getUnitUsahaList();
      return res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBySlug(req: Request, res: Response) {
    try {
      const slug = String(req.params.slug);
      const u = await unitUsahaService.getBySlug(slug);
      return res.status(200).json({ success: true, data: u });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const created = await unitUsahaService.createUnitUsaha(req.body, performedBy);
      return res.status(201).json({ success: true, data: created, message: 'Unit usaha berhasil ditambahkan.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      const updated = await unitUsahaService.updateUnitUsaha(id, req.body, performedBy);
      return res.status(200).json({ success: true, data: updated, message: 'Unit usaha berhasil diperbarui.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      await unitUsahaService.deleteUnitUsaha(id, performedBy);
      return res.status(200).json({ success: true, message: 'Unit usaha berhasil dihapus.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const unitUsahaController = new UnitUsahaController();
