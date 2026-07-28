import { Request, Response, NextFunction } from 'express';
import { pengurusService } from './pengurus.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { storageProvider } from '../../config/storage';

export const pengurusController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pengurusService.list(req.query);
      res.json(successResponse(result.data, 'Pengurus fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await pengurusService.getById(req.params.id);
      res.json(successResponse(item));
    } catch (e) { next(e); }
  },


  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {

      let imageUrl: string | undefined;
      if ((req as any).file) {
        imageUrl = await storageProvider.save((req as any).file, 'pengurus');
      }

      const item = await pengurusService.create(req.body, imageUrl, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('pengurus:created', item);
      res.status(201).json(successResponse(item, 'Pengurus created'));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {

      let imageUrl: string | undefined;
      if ((req as any).file) {
        imageUrl = await storageProvider.save((req as any).file, 'pengurus');
      }

      const item = await pengurusService.update(req.params.id, req.body, imageUrl, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('pengurus:updated', item);
      res.json(successResponse(item, 'Pengurus updated'));
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await pengurusService.delete(req.params.id, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('pengurus:deleted', { id: req.params.id });
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
