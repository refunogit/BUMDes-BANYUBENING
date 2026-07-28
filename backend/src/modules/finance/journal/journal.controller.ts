import { Request, Response, NextFunction } from 'express';
import { journalService } from './journal.service';
import { successResponse } from '../../../utils/response';
import { AuthRequest } from '../../../middlewares/auth.middleware';

export const journalController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journalService.list(req.query);
      res.json(successResponse(result.data, 'Journals fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await journalService.getById(req.params.id);
      res.json(successResponse(data));
    } catch (e) { next(e); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const journal = await journalService.create(req.body, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('journal:created', journal);
      res.status(201).json(successResponse(journal, 'Journal created'));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const journal = await journalService.update(req.params.id, req.body, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('journal:updated', journal);
      res.json(successResponse(journal, 'Journal updated'));
    } catch (e) { next(e); }
  },

  async postJournal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const journal = await journalService.postJournal(req.params.id, status, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('journal:posted', journal);
      res.json(successResponse(journal, `Journal ${status}`));
    } catch (e) { next(e); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await journalService.delete(req.params.id, req.user?.userId, req.ip, req.headers['user-agent']);
      const io = (req.app as any).get('io');
      if (io) io.emit('journal:deleted', { id: req.params.id });
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
