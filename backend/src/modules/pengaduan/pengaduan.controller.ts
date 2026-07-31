import { Request, Response } from 'express';
import { pengaduanService } from './pengaduan.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class PengaduanController {
  async handleWebhook(req: Request, res: Response) {
    try {
      const result = await pengaduanService.processFonnteWebhook(req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getConversations(req: AuthenticatedRequest, res: Response) {
    try {
      const list = await pengaduanService.getConversationList();
      return res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const number = String(req.params.number);
      const history = await pengaduanService.getConversationHistory(number);
      return res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async sendReply(req: AuthenticatedRequest, res: Response) {
    try {
      const { senderNumber, replyText } = req.body;
      const performedBy = req.user?.email || 'ADMIN';
      const result = await pengaduanService.sendReply(String(senderNumber), String(replyText), performedBy);
      return res.status(201).json({
        success: true,
        data: result,
        message: 'Balasan pengaduan berhasil dikirim ke WhatsApp warga.',
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async handlePublicChat(req: Request, res: Response) {
    try {
      const { senderNumber, senderName, message } = req.body;
      const result = await pengaduanService.processPublicChat({
        senderNumber: String(senderNumber),
        senderName: String(senderName || ''),
        message: String(message),
      });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getPublicChatHistory(req: Request, res: Response) {
    try {
      const number = String(req.params.number);
      const history = await pengaduanService.getPublicChatHistory(number);
      return res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const pengaduanController = new PengaduanController();
