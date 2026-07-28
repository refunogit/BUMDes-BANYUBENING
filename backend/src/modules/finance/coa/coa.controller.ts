import { Request, Response, NextFunction } from 'express';
import { coaService } from './coa.service';
import { successResponse } from '../../../utils/response';
import { AuthRequest } from '../../../middlewares/auth.middleware';

export const coaController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await coaService.list(req.query);
      res.json(successResponse(result.data, 'CoA fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },

  async tree(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await coaService.tree();
      res.json(successResponse(data));
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await coaService.getById(req.params.id);
      res.json(successResponse(data));
    } catch (e) { next(e); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const coa = await coaService.create(req.body, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('coa:created', coa);
      res.status(201).json(successResponse(coa, 'CoA created'));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const coa = await coaService.update(req.params.id, req.body, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('coa:updated', coa);
      res.json(successResponse(coa, 'CoA updated'));
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await coaService.delete(req.params.id, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('coa:deleted', { id: req.params.id });
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
