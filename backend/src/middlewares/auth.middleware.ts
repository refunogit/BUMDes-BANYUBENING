import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { AppError } from './error.middleware';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Validate user still exists and active
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      throw new AppError(401, 'User inactive or not found');
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError(401, 'Invalid or expired token'));
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated'));
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }
    next();
  };
}
