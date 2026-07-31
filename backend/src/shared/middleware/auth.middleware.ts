import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const getSecret = () => process.env.JWT_ACCESS_SECRET || 'bumdes_banyubening_access_secret_enterprise_key_2026_super_secure';

export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Akses ditolak. Token otentikasi tidak ditemukan.' });
    }

    const decoded = jwt.verify(token, getSecret()) as { id: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch (err: any) {
    logger.warn({ err: err.message }, 'JWT verification failed');
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }
    if (token) {
      const decoded = jwt.verify(token, getSecret()) as { id: string; email: string; role: string };
      req.user = decoded;
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Akses ditolak. Memerlukan hak akses Admin BUMDes.' });
  }
  next();
};
