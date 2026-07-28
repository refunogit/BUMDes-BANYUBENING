import { Request, Response, NextFunction } from 'express';
import { ledgerService } from './ledger.service';
import { successResponse } from '../../../utils/response';

export const ledgerController = {
  async getLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ledgerService.getLedger(req.query);
      res.json(successResponse(result.data, 'Ledger fetched', { pagination: result.pagination, summary: result.summary }));
    } catch (e) { next(e); }
  },

  async getCoaBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const result = await ledgerService.getCoaBalance(req.params.coaId, startDate, endDate);
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
