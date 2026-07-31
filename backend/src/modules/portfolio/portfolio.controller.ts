import { Request, Response } from 'express';
import { portfolioService } from './portfolio.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class PortfolioController {
  async getList(req: Request, res: Response) {
    try {
      const list = await portfolioService.getPortfolios();
      return res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const created = await portfolioService.createPortfolio(req.body, performedBy);
      return res.status(201).json({ success: true, data: created, message: 'Portofolio berhasil ditambahkan.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      const updated = await portfolioService.updatePortfolio(id, req.body, performedBy);
      return res.status(200).json({ success: true, data: updated, message: 'Portofolio berhasil diperbarui.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      await portfolioService.deletePortfolio(id, performedBy);
      return res.status(200).json({ success: true, message: 'Portofolio berhasil dihapus.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const portfolioController = new PortfolioController();
