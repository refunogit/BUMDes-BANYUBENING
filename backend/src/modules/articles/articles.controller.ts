import { Request, Response } from 'express';
import { articlesService } from './articles.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class ArticlesController {
  async getArticles(req: Request, res: Response) {
    try {
      const { category, q } = req.query;
      const list = await articlesService.getArticles(category as string, q as string);
      return res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBySlug(req: Request, res: Response) {
    try {
      const slug = String(req.params.slug);
      const art = await articlesService.getArticleBySlug(slug);
      return res.status(200).json({ success: true, data: art });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const created = await articlesService.createArticle(req.body, performedBy);
      return res.status(201).json({ success: true, data: created, message: 'Artikel berhasil diterbitkan.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      const updated = await articlesService.updateArticle(id, req.body, performedBy);
      return res.status(200).json({ success: true, data: updated, message: 'Artikel berhasil diperbarui.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const performedBy = req.user?.email || 'ADMIN';
      await articlesService.deleteArticle(id, performedBy);
      return res.status(200).json({ success: true, message: 'Artikel berhasil dihapus.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const articlesController = new ArticlesController();
