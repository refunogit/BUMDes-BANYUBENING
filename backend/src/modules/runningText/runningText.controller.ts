import { Request, Response, NextFunction } from 'express';
import { runningTextService } from './runningText.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';


export const runningTextController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await runningTextService.list(req.query);
      res.json(successResponse(result.data, 'RunningText fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await runningTextService.getById(req.params.id);
      res.json(successResponse(item));
    } catch (e) { next(e); }
  },


  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {

      const item = await runningTextService.create(req.body,  req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('runningText:created', item);
      res.status(201).json(successResponse(item, 'RunningText created'));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {

      const item = await runningTextService.update(req.params.id, req.body,  req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('runningText:updated', item);
      res.json(successResponse(item, 'RunningText updated'));
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await runningTextService.delete(req.params.id, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('runningText:deleted', { id: req.params.id });
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
