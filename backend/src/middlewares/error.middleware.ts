import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/pino';
import { env } from '../config/env';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.originalUrl}`));
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error({ err, stack: err.stack }, 'Error handler caught');

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Prisma errors
  if ((err as any).code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry - unique constraint failed',
      field: (err as any).meta?.target,
    });
  }

  const statusCode = (err as any).statusCode || 500;
  const message = statusCode === 500 && env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
}
