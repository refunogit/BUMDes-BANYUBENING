import { Request, Response, NextFunction } from 'express';
import { themeConfigService } from './theme.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';


export const themeConfigController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await themeConfigService.list(req.query);
      res.json(successResponse(result.data, 'ThemeConfig fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await themeConfigService.getById(req.params.id);
      res.json(successResponse(item));
    } catch (e) { next(e); }
  },


  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {

      const item = await themeConfigService.create(req.body,  req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('themeConfig:created', item);
      res.status(201).json(successResponse(item, 'ThemeConfig created'));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {

      const item = await themeConfigService.update(req.params.id, req.body,  req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('themeConfig:updated', item);
      res.json(successResponse(item, 'ThemeConfig updated'));
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await themeConfigService.delete(req.params.id, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('themeConfig:deleted', { id: req.params.id });
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
