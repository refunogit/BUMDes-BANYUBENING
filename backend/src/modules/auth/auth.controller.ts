import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password, req.ip, req.headers['user-agent']);
      res.json(successResponse(result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      res.json(successResponse(result, 'Token refreshed'));
    } catch (error) {
      next(error);
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.me(req.user!.userId);
      res.json(successResponse(user));
    } catch (error) {
      next(error);
    }
  },

  async getAllUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await authService.getAllUsers();
      res.json(successResponse(users));
    } catch (error) {
      next(error);
    }
  },

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.createUser(req.body);
      res.status(201).json(successResponse(user, 'User created'));
    } catch (error) {
      next(error);
    }
  },

  async verifyPin(req: Request, res: Response, next: NextFunction) {
    try {
      const { pin } = req.body;
      const valid = await authService.verifyPin(pin);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid PIN' });
      }
      res.json(successResponse({ valid: true }, 'PIN valid'));
    } catch (error) {
      next(error);
    }
  },

  async updatePin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { oldPin, newPin } = req.body;
      const result = await authService.updatePin(oldPin, newPin, req.user!.userId);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  },
};
