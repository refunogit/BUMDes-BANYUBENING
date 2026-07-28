import { Request, Response, NextFunction } from 'express';
import { backupService } from './backup.service';
import { successResponse } from '../../utils/response';

export const backupController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await backupService.list();
      const files = await backupService.getVersionedBackups();
      res.json(successResponse({ logs, files }));
    } catch (e) { next(e); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const backup = await backupService.createManualBackup();
      const io = (req.app as any).get('io');
      if (io) io.emit('backup:created', backup);
      res.status(201).json(successResponse(backup, 'Backup created'));
    } catch (e) { next(e); }
  },

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileName } = req.body;
      if (!fileName) return res.status(400).json({ success: false, message: 'fileName required' });
      const result = await backupService.restoreFromFile(fileName);
      const io = (req.app as any).get('io');
      if (io) io.emit('backup:restored', { fileName });
      res.json(successResponse(result, 'Restore processed'));
    } catch (e) { next(e); }
  },

  async cleanup(req: Request, res: Response, next: NextFunction) {
    try {
      const { keepDays } = req.query as any;
      const result = await backupService.cleanupOldBackups(keepDays ? parseInt(keepDays) : 30);
      res.json(successResponse(result, 'Cleanup completed'));
    } catch (e) { next(e); }
  },
};
