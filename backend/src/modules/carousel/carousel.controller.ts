import { Request, Response, NextFunction } from 'express';
import { carouselService } from './carousel.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { storageProvider } from '../../config/storage';

export const carouselController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await carouselService.list(req.query);
      res.json(successResponse(result.data, 'Carousel fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },

  async active(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await carouselService.getActive();
      res.json(successResponse(data));
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await carouselService.getById(req.params.id);
      res.json(successResponse(item));
    } catch (e) { next(e); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      let imageUrl = '';
      if ((req as any).file) {
        imageUrl = await storageProvider.save((req as any).file, 'carousel');
      }
      const item = await carouselService.create(req.body, imageUrl, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('carousel:created', item);
      res.status(201).json(successResponse(item, 'Carousel created'));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      let imageUrl: string | undefined;
      if ((req as any).file) {
        imageUrl = await storageProvider.save((req as any).file, 'carousel');
      }
      const item = await carouselService.update(req.params.id, req.body, imageUrl, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('carousel:updated', item);
      res.json(successResponse(item, 'Carousel updated'));
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await carouselService.delete(req.params.id, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('carousel:deleted', { id: req.params.id });
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
