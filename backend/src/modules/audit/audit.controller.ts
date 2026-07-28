import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { successResponse } from '../../utils/response';

export const auditController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await auditService.list(req.query);
      res.json(successResponse(result.data, 'Audit logs fetched', { pagination: result.pagination }));
    } catch (e) { next(e); }
  },
};
