import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from './auth.middleware';
import { AppError } from './error.middleware';
import { env } from '../config/env';
import { prisma } from '../config/database';

// Dual-layer authentication: JWT + PIN
// PIN can be stored in .env as PIN_CODE or PIN_HASH, or in Settings table as editable by admin

async function getStoredPinHash(): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'PIN_HASH' } });
    if (setting?.value) return setting.value;
  } catch {}
  if (env.PIN_HASH) return env.PIN_HASH;
  // fallback hash the plain PIN_CODE
  if (env.PIN_CODE) {
    return await bcrypt.hash(env.PIN_CODE, 10);
  }
  return '';
}

export async function requirePin(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const pin = (req.headers['x-pin'] as string) || (req.body && req.body.pin);

    if (!pin) {
      throw new AppError(401, 'PIN required for this operation (X-PIN header)');
    }

    // First check plain env PIN_CODE for ease
    if (env.PIN_CODE && pin === env.PIN_CODE) {
      return next();
    }

    const hash = await getStoredPinHash();
    if (!hash) {
      throw new AppError(500, 'PIN not configured');
    }

    const isValid = await bcrypt.compare(pin, hash);
    if (!isValid) {
      throw new AppError(401, 'Invalid PIN');
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalPin(req: AuthRequest, _res: Response, next: NextFunction) {
  const pin = (req.headers['x-pin'] as string) || (req.body && req.body.pin);
  if (!pin) return next();
  return requirePin(req, _res, next);
}
