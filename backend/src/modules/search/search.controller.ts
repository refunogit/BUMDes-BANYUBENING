import { Request, Response, NextFunction } from 'express';
import { searchService } from './search.service';
import { successResponse } from '../../utils/response';

export const searchController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, query } = req.query as any;
      const result = await searchService.search((q || query) as string);
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },

  async suggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, query } = req.query as any;
      const result = await searchService.suggestions((q || query) as string);
      res.json(successResponse(result));
    } catch (e) { next(e); }
  },
};
