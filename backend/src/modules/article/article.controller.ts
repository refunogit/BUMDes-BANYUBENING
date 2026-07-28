import { Request, Response, NextFunction } from 'express';
import { articleService } from './article.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { storageProvider } from '../../config/storage';

export const articleController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await articleService.list(req.query);
      res.json(successResponse(result.data, 'Articles fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },

  async publicList(req: Request, res: Response, next: NextFunction) {
    try {
      const query = { ...req.query, isPublished: 'true' };
      const result = await articleService.list(query);
      res.json(successResponse(result.data, 'Articles fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const article = await articleService.getBySlug(req.params.slug);
      res.json(successResponse(article));
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const article = await articleService.getById(req.params.id);
      res.json(successResponse(article));
    } catch (e) { next(e); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      let coverImageUrl: string | undefined;
      if ((req as any).file) {
        coverImageUrl = await storageProvider.save((req as any).file, 'articles');
      }
      const article = await articleService.create(req.body, coverImageUrl, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('article:created', article);
      res.status(201).json(successResponse(article, 'Article created'));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      let coverImageUrl: string | undefined;
      if ((req as any).file) {
        coverImageUrl = await storageProvider.save((req as any).file, 'articles');
      }
      const article = await articleService.update(req.params.id, req.body, coverImageUrl, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('article:updated', article);
      res.json(successResponse(article, 'Article updated'));
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await articleService.delete(req.params.id, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('article:deleted', { id: req.params.id });
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
