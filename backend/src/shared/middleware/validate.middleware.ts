import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../logger';

export const validateBody = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.errors }, 'Body validation failed');
        return res.status(400).json({
          success: false,
          message: 'Validasi input gagal',
          errors: error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validasi parameter query gagal',
          errors: error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
      }
      next(error);
    }
  };
};
