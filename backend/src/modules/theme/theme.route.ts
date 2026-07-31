import { Router } from 'express';
import { z } from 'zod';
import { themeController } from './theme.controller';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';

const router = Router();

const activateThemeSchema = z.object({
  themeCode: z.string().min(1, 'Kode tema liburan wajib diisi'),
});

const scheduleSchema = z.object({
  isAutoSchedule: z.boolean(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
});

router.get('/active', (req, res) => themeController.getActiveTheme(req, res));
router.get('/settings', verifyToken, requireAdmin, (req, res) => themeController.getActiveTheme(req, res));
router.put('/activate', verifyToken, requireAdmin, validateBody(activateThemeSchema), (req, res) =>
  themeController.activateTheme(req, res)
);
router.put('/schedule', verifyToken, requireAdmin, validateBody(scheduleSchema), (req, res) =>
  themeController.setSchedule(req, res)
);

export const themeRouter = router;
