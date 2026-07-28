import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const notificationController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.list(req.user?.userId, req.query);
      res.json(successResponse(result.data, 'Notifications fetched', { total: result.total }));
    } catch (e) { next(e); }
  },

  async publicList(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.list(undefined, req.query);
      res.json(successResponse(result.data, 'Notifications fetched'));
    } catch (e) { next(e); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.create(req.body);
      const io = (req.app as any).get('io');
      if (io) {
        io.emit('notification:new', notification);
        if (notification.userId) io.to(`user:${notification.userId}`).emit('notification:new', notification);
      }
      res.status(201).json(successResponse(notification, 'Notification created'));
    } catch (e) { next(e); }
  },

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAsRead(req.params.id, req.user?.userId);
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAllAsRead(req.user?.userId);
      res.json(successResponse(result, 'All marked as read'));
    } catch (e) { next(e); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.delete(req.params.id);
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
