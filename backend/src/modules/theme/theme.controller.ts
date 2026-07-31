import { Request, Response } from 'express';
import { themeService, HOLIDAY_THEMES } from './theme.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class ThemeController {
  async getActiveTheme(req: Request, res: Response) {
    try {
      const result = await themeService.getActiveTheme();
      return res.status(200).json({
        success: true,
        data: result,
        availableThemes: Object.values(HOLIDAY_THEMES),
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async activateTheme(req: AuthenticatedRequest, res: Response) {
    try {
      const { themeCode } = req.body;
      const performedBy = req.user?.email || 'ADMIN';
      const result = await themeService.activateTheme(themeCode, performedBy);
      return res.status(200).json({
        success: true,
        data: result,
        message: `Tema ${result.metadata.name} berhasil diaktifkan.`,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async setSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      const { isAutoSchedule, scheduledStart, scheduledEnd } = req.body;
      const performedBy = req.user?.email || 'ADMIN';
      const result = await themeService.setSchedule(isAutoSchedule, scheduledStart, scheduledEnd, performedBy);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Jadwal otomatis tema liburan diperbarui.',
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const themeController = new ThemeController();
