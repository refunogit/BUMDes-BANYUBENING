import { Request, Response, NextFunction } from 'express';
import { programKerjaService } from './programKerja.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { storageProvider } from '../../config/storage';

export const programKerjaController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await programKerjaService.list(req.query);
      res.json(successResponse(result.data, 'ProgramKerja fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await programKerjaService.getById(req.params.id);
      res.json(successResponse(item));
    } catch (e) { next(e); }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await programKerjaService.getBySlug(req.params.slug);
      res.json(successResponse(item));
    } catch (e) { next(e); }
  },


  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {

      let imageUrl: string | undefined;
      if ((req as any).file) {
        imageUrl = await storageProvider.save((req as any).file, 'programKerja');
      }

      const item = await programKerjaService.create(req.body, imageUrl, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('programKerja:created', item);
      res.status(201).json(successResponse(item, 'ProgramKerja created'));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {

      let imageUrl: string | undefined;
      if ((req as any).file) {
        imageUrl = await storageProvider.save((req as any).file, 'programKerja');
      }

      const item = await programKerjaService.update(req.params.id, req.body, imageUrl, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('programKerja:updated', item);
      res.json(successResponse(item, 'ProgramKerja updated'));
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await programKerjaService.delete(req.params.id, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('programKerja:deleted', { id: req.params.id });
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
