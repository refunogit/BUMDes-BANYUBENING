import { Request, Response, NextFunction } from 'express';
import { reportService } from './report.service';
import { successResponse } from '../../../utils/response';

export const reportController = {
  async labaRugi(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, format } = req.query as any;
      const data = await reportService.labaRugi(startDate, endDate);

      if (format === 'pdf') {
        const pdf = await reportService.generatePdf('laba-rugi', data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=laba-rugi.pdf');
        return res.send(pdf);
      }
      if (format === 'excel') {
        const excel = await reportService.generateExcel('laba-rugi', data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=laba-rugi.xlsx');
        return res.send(excel);
      }

      res.json(successResponse(data));
    } catch (e) { next(e); }
  },

  async neraca(req: Request, res: Response, next: NextFunction) {
    try {
      const { asOfDate, format } = req.query as any;
      const data = await reportService.neraca(asOfDate);

      if (format === 'pdf') {
        const pdf = await reportService.generatePdf('neraca', data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=neraca.pdf');
        return res.send(pdf);
      }
      if (format === 'excel') {
        const excel = await reportService.generateExcel('neraca', data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=neraca.xlsx');
        return res.send(excel);
      }

      res.json(successResponse(data));
    } catch (e) { next(e); }
  },

  async arusKas(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, format } = req.query as any;
      const data = await reportService.arusKas(startDate, endDate);

      if (format === 'pdf') {
        const pdf = await reportService.generatePdf('arus-kas', data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=arus-kas.pdf');
        return res.send(pdf);
      }
      if (format === 'excel') {
        const excel = await reportService.generateExcel('arus-kas', data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=arus-kas.xlsx');
        return res.send(excel);
      }

      res.json(successResponse(data));
    } catch (e) { next(e); }
  },

  async perubahanModal(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, format } = req.query as any;
      const data = await reportService.perubahanModal(startDate, endDate);

      if (format === 'pdf') {
        const pdf = await reportService.generatePdf('perubahan-modal', data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=perubahan-modal.pdf');
        return res.send(pdf);
      }
      if (format === 'excel') {
        const excel = await reportService.generateExcel('perubahan-modal', data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=perubahan-modal.xlsx');
        return res.send(excel);
      }

      res.json(successResponse(data));
    } catch (e) { next(e); }
  },

  async publicSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getPublicFinancialSummary();
      res.json(successResponse(data));
    } catch (e) { next(e); }
  },
};
