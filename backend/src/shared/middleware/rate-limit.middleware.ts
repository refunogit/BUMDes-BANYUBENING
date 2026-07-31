import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { cache } from '../redis/cache';
import { logger } from '../logger';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan dari IP ini. Silakan coba lagi nanti.',
  },
});

export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan tunggu beberapa menit.',
  },
});

export const checkIpLockout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const lockKey = `lockout_ip_${ip}`;
    const lockedUntil = await cache.get(lockKey);
    if (lockedUntil) {
      logger.warn({ ip }, 'Blocked login attempt from temporarily locked IP');
      return res.status(429).json({
        success: false,
        message: 'IP Anda telah dikunci sementara karena 3 kali percobaan gagal berturut-turut. Silakan coba lagi setelah 15 menit.',
      });
    }
    next();
  } catch (err) {
    next();
  }
};

export const recordFailedLoginAttempt = async (ip: string): Promise<void> => {
  const attemptKey = `failed_attempts_${ip}`;
  const lockKey = `lockout_ip_${ip}`;
  const current = await cache.get(attemptKey);
  const attempts = current ? parseInt(current, 10) + 1 : 1;
  if (attempts >= 3) {
    // Lock for 15 minutes (900 seconds)
    await cache.set(lockKey, 'locked', 900);
    await cache.del(attemptKey);
    logger.warn({ ip, attempts }, 'IP locked out for 15 minutes due to 3 consecutive failed OTP/PIN attempts');
  } else {
    await cache.set(attemptKey, String(attempts), 900);
  }
};

export const clearFailedLoginAttempt = async (ip: string): Promise<void> => {
  const attemptKey = `failed_attempts_${ip}`;
  await cache.del(attemptKey);
};
