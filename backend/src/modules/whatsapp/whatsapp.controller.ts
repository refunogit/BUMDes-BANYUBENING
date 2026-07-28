import { Request, Response, NextFunction } from 'express';
import { whatsappService } from './whatsapp.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const whatsappController = {
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await whatsappService.getConfig();
      res.json(successResponse(config));
    } catch (e) { next(e); }
  },

  async updateConfig(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const config = await whatsappService.updateConfig(req.body);
      res.json(successResponse(config, 'WhatsApp config updated'));
    } catch (e) { next(e); }
  },

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { to, message } = req.body;
      const log = await whatsappService.enqueueMessage(to, message);
      const io = (req.app as any).get('io');
      if (io) io.emit('whatsapp:queued', log);
      res.json(successResponse(log, 'Message queued'));
    } catch (e) { next(e); }
  },

  async sendBulk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { to, message } = req.body as { to: string[]; message: string };
      const results = [];
      for (const number of to) {
        const log = await whatsappService.enqueueMessage(number, message);
        results.push(log);
      }
      res.json(successResponse(results, `${results.length} messages queued`));
    } catch (e) { next(e); }
  },

  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await whatsappService.getLogs(req.query);
      res.json(successResponse(logs.data, 'Logs fetched', { total: logs.total }));
    } catch (e) { next(e); }
  },

  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Webhook for incoming messages
      const { from, message, text } = req.body;
      const incomingText = message || text;
      if (!from || !incomingText) {
        return res.status(400).json({ success: false, message: 'from and message required' });
      }
      const reply = await whatsappService.simulateIncomingMessage(from, incomingText);
      res.json(successResponse({ reply }, 'Webhook processed'));
    } catch (e) { next(e); }
  },

  async testCommand(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, text } = req.body;
      const reply = await whatsappService.simulateIncomingMessage(from || '628123456789', text || '/help');
      res.json(successResponse({ reply }));
    } catch (e) { next(e); }
  },
};
