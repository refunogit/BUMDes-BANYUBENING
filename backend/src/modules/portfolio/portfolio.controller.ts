import { Request, Response, NextFunction } from 'express';
import { portfolioService } from './portfolio.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { storageProvider } from '../../config/storage';

export const portfolioController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await portfolioService.list(req.query);
      res.json(successResponse(result.data, 'Portfolio fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await portfolioService.getById(req.params.id);
      res.json(successResponse(item));
    } catch (e) { next(e); }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await portfolioService.getBySlug(req.params.slug);
      res.json(successResponse(item));
    } catch (e) { next(e); }
  },


  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {

      let imageUrl: string | undefined;
      if ((req as any).file) {
        imageUrl = await storageProvider.save((req as any).file, 'portfolio');
      }

      const item = await portfolioService.create(req.body, imageUrl, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('portfolio:created', item);
      res.status(201).json(successResponse(item, 'Portfolio created'));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {

      let imageUrl: string | undefined;
      if ((req as any).file) {
        imageUrl = await storageProvider.save((req as any).file, 'portfolio');
      }

      const item = await portfolioService.update(req.params.id, req.body, imageUrl, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('portfolio:updated', item);
      res.json(successResponse(item, 'Portfolio updated'));
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await portfolioService.delete(req.params.id, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('portfolio:deleted', { id: req.params.id });
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
