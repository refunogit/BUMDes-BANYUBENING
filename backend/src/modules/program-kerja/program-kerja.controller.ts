import { Request, Response } from 'express';
import { programKerjaService } from './program-kerja.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class ProgramKerjaController {
  async getList(req: AuthenticatedRequest, res: Response) {
    try {
      const isAdmin = Boolean(req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN'));
      const list = await programKerjaService.getProgramKerjaList(isAdmin);
      return res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const isAdmin = Boolean(req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN'));
      const item = await programKerjaService.getProgramKerjaById(id, isAdmin);
      return res.status(200).json({ success: true, data: item });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const created = await programKerjaService.createProgramKerja(req.body, performedBy);
      return res.status(201).json({ success: true, data: created, message: 'Program kerja berhasil ditambahkan.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      const updated = await programKerjaService.updateProgramKerja(id, req.body, performedBy);
      return res.status(200).json({ success: true, data: updated, message: 'Program kerja berhasil diperbarui.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      await programKerjaService.deleteProgramKerja(id, performedBy);
      return res.status(200).json({ success: true, message: 'Program kerja berhasil dihapus.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async addComment(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const comment = await programKerjaService.addComment(id, req.body);
      return res.status(201).json({ success: true, data: comment, message: 'Komentar Anda berhasil dikirim.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getComments(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const isAdmin = Boolean(req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN'));
      const comments = await programKerjaService.getComments(id, isAdmin);
      return res.status(200).json({ success: true, data: comments });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteComment(req: AuthenticatedRequest, res: Response) {
    try {
      const commentId = String(req.params.commentId);
      const performedBy = req.user?.email || 'ADMIN';
      await programKerjaService.deleteComment(commentId, performedBy);
      return res.status(200).json({ success: true, message: 'Komentar berhasil dihapus.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const programKerjaController = new ProgramKerjaController();
