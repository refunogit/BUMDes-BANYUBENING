import { Request, Response, NextFunction } from 'express';
import { identityService } from './identity.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { storageProvider } from '../../config/storage';

export const identityController = {
  async get(_req: Request, res: Response, next: NextFunction) {
    try {
      const identity = await identityService.get();
      res.json(successResponse(identity));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as any;
      let logoUrl: string | undefined;
      let faviconUrl: string | undefined;

      // handle via storage provider if files exist
      if (files?.logo?.[0]) {
        logoUrl = await storageProvider.save(files.logo[0], 'identity');
      }
      if (files?.favicon?.[0]) {
        faviconUrl = await storageProvider.save(files.favicon[0], 'identity');
      }

      const updated = await identityService.updateWithUrls(
        req.body,
        logoUrl,
        faviconUrl,
        req.user?.userId,
        req.ip,
        req.headers['user-agent']
      );

      // Emit realtime update via socket.io if available
      const io = (req.app as any).get('io');
      if (io) io.emit('identity:updated', updated);

      res.json(successResponse(updated, 'Identity updated'));
    } catch (e) { next(e); }
  },
};
