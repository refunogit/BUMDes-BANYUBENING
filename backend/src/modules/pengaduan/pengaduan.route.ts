import { Router } from 'express';
import { z } from 'zod';
import { pengaduanController } from './pengaduan.controller';
import { verifyToken, requireAdmin } from '../../shared/middleware/auth.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';

const router = Router();

const replySchema = z.object({
  senderNumber: z.string().min(3, 'Nomor WhatsApp warga wajib diisi'),
  replyText: z.string().min(1, 'Isi balasan pesan wajib diisi'),
});

const publicChatSchema = z.object({
  senderNumber: z.string().min(3, 'Nomor WhatsApp wajib diisi'),
  senderName: z.string().optional(),
  message: z.string().min(1, 'Pesan tidak boleh kosong'),
});

// Incoming Fonnte webhook (public endpoint)
router.post('/webhook', (req, res) => pengaduanController.handleWebhook(req, res));

// Public Website WhatsApp Shell Chat Widget endpoints
router.post('/chat', validateBody(publicChatSchema), (req, res) =>
  pengaduanController.handlePublicChat(req, res)
);
router.get('/chat/:number', (req, res) => pengaduanController.getPublicChatHistory(req, res));

// Admin Dashboard endpoints for split layout & reply
router.get('/conversations', verifyToken, requireAdmin, (req, res) =>
  pengaduanController.getConversations(req, res)
);
router.get('/conversations/:number', verifyToken, requireAdmin, (req, res) =>
  pengaduanController.getHistory(req, res)
);
router.post('/reply', verifyToken, requireAdmin, validateBody(replySchema), (req, res) =>
  pengaduanController.sendReply(req, res)
);

export const pengaduanRouter = router;
