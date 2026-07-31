import { pengaduanRepository } from './pengaduan.repository';
import { fonnteService } from '../../shared/fonnte/fonnte.service';
import { emitNewPengaduan, emitPengaduanReply } from '../../shared/socket';
import { logAudit, logger } from '../../shared/logger';
import { prisma } from '../../shared/prisma/client';

export class PengaduanService {
  /**
   * Fonnte webhook handler with WhatsApp Bot Command Handler (#info, #produk, #program, #help)
   */
  async processFonnteWebhook(payload: any) {
    const senderNumber = payload.sender || payload.phone || payload.from;
    const messageText = String(payload.message || payload.text || '').trim();
    const senderName = payload.name || payload.senderName || `Warga (${senderNumber})`;

    if (!senderNumber || !messageText) {
      logger.warn({ payload }, 'Received Fonnte webhook without sender number or message');
      return { success: false, message: 'Invalid payload' };
    }

    const cleanNumber = String(senderNumber).replace(/\D/g, '');

    // 1. Check if incoming message is a Bot Command
    const lowerText = messageText.toLowerCase();
    if (lowerText === '#info' || lowerText === '#help' || lowerText === '/help' || lowerText === '/info') {
      const botReply =
        `*🤖 Bot WhatsApp BUMDes Banyubening*\n\n` +
        `Halo ${senderName}! Selamat datang di layanan otomatis BUMDes Banyubening.\n\n` +
        `Daftar Perintah Cepat:\n` +
        `• *#produk* : Lihat katalog produk dan harga BUMDes terkini\n` +
        `• *#program* : Lihat jadwal dan progres program kerja desa\n` +
        `• *#info* : Tampilkan menu bantuan ini\n\n` +
        `Untuk menyampaikan pengaduan atau pertanyaan langsung ke Admin, silakan ketik pesan biasa tanpa awalan tanda #. Tim Admin kami siap membantu Anda!`;

      await fonnteService.queueMessage({
        target: cleanNumber,
        message: botReply,
        type: 'BOT_REPLY',
        retries: 0,
      });

      logger.info({ cleanNumber, command: '#info' }, 'Executed WhatsApp Bot command #info');
      return { success: true, message: 'Bot command #info executed', data: { command: '#info', reply: botReply } };
    }

    if (lowerText === '#produk' || lowerText === '/produk') {
      const topProducts = await prisma.product.findMany({
        where: { stock: { gt: 0 } },
        orderBy: { soldCount: 'desc' },
        take: 5,
      });

      let productListText = `*🛒 Produk Unggulan BUMDes Banyubening*\n\n`;
      if (topProducts.length === 0) {
        productListText += `Saat ini semua produk sedang dalam proses restock.`;
      } else {
        topProducts.forEach((p, index) => {
          productListText += `${index + 1}. *${p.name}*\n   Harga: Rp ${p.price.toLocaleString('id-ID')} / ${p.unitName}\n   Stok: ${p.stock}\n\n`;
        });
      }
      productListText += `Kunjungi website resmi kami atau balas pesan ini untuk memesan.`;

      await fonnteService.queueMessage({
        target: cleanNumber,
        message: productListText,
        type: 'BOT_REPLY',
        retries: 0,
      });

      logger.info({ cleanNumber, command: '#produk' }, 'Executed WhatsApp Bot command #produk');
      return { success: true, message: 'Bot command #produk executed', data: { command: '#produk', reply: productListText } };
    }

    if (lowerText === '#program' || lowerText === '/program') {
      const topPrograms = await prisma.programKerja.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      let progListText = `*📋 Program Kerja & Kemajuan BUMDes Banyubening*\n\n`;
      if (topPrograms.length === 0) {
        progListText += `Belum ada program kerja aktif yang dipublikasikan.`;
      } else {
        topPrograms.forEach((p, index) => {
          progListText += `${index + 1}. *${p.title}*\n   Tanggal: ${p.date}\n   Tim: ${p.teamName}\n\n`;
        });
      }
      progListText += `Lihat detail dokumentasi dan kolom komentar pada website resmi BUMDes Banyubening.`;

      await fonnteService.queueMessage({
        target: cleanNumber,
        message: progListText,
        type: 'BOT_REPLY',
        retries: 0,
      });

      logger.info({ cleanNumber, command: '#program' }, 'Executed WhatsApp Bot command #program');
      return { success: true, message: 'Bot command #program executed', data: { command: '#program', reply: progListText } };
    }

    // 2. Standard Incoming Citizen Live Chat Message (Pengaduan)
    const saved = await pengaduanRepository.saveMessage({
      senderNumber: cleanNumber,
      senderName: String(senderName),
      message: String(messageText),
      direction: 'INCOMING',
      status: 'UNREAD',
    });

    logger.info({ senderNumber: cleanNumber, id: saved.id }, 'Incoming WhatsApp Pengaduan captured via Fonnte webhook');
    emitNewPengaduan(saved);

    return { success: true, message: 'Pengaduan received and broadcasted', data: saved };
  }

  async getConversationList() {
    return pengaduanRepository.getConversationSummary();
  }

  async getConversationHistory(senderNumber: string) {
    await pengaduanRepository.markConversationAsRead(senderNumber);
    return pengaduanRepository.getConversationByNumber(senderNumber);
  }

  async sendReply(senderNumber: string, replyText: string, performedBy = 'ADMIN') {
    if (!senderNumber || !replyText) {
      throw new Error('Nomor tujuan dan isi balasan wajib diisi.');
    }

    const cleanNumber = senderNumber.replace(/\D/g, '');
    const sentToWa = await fonnteService.sendPengaduanReply(cleanNumber, replyText);

    const savedReply = await pengaduanRepository.saveMessage({
      senderNumber: cleanNumber,
      senderName: 'Admin BUMDes Banyubening',
      message: replyText,
      direction: 'OUTGOING',
      status: 'REPLIED',
    });

    logAudit('REPLY_PENGADUAN', 'PengaduanMessage', savedReply.id, performedBy, {
      senderNumber: cleanNumber,
      sentToWa,
    });

    emitPengaduanReply(savedReply);
    return savedReply;
  }

  /**
   * Public Website WhatsApp Shell Chat Handler (processes Bot Commands & Live Chat with Fonnte)
   */
  async processPublicChat(payload: { senderNumber: string; senderName: string; message: string }) {
    const cleanNumber = String(payload.senderNumber || '').replace(/\D/g, '').trim();
    const cleanName = String(payload.senderName || `Warga (${cleanNumber})`).trim();
    const messageText = String(payload.message || '').trim();

    if (!cleanNumber || !messageText) {
      throw new Error('Nomor WhatsApp dan pesan wajib diisi.');
    }

    // 1. Record incoming citizen message
    const savedIncoming = await pengaduanRepository.saveMessage({
      senderNumber: cleanNumber,
      senderName: cleanName,
      message: messageText,
      direction: 'INCOMING',
      status: 'UNREAD',
    });
    emitNewPengaduan(savedIncoming);

    // 2. Check if message is a Bot Command (#info, #produk, #program, #help)
    const lower = messageText.toLowerCase();
    if (lower === '#info' || lower === '#help' || lower === '/info' || lower === '/help') {
      const botReplyText =
        `*🤖 Bot WhatsApp BUMDes Banyubening*\n\n` +
        `Halo ${cleanName}! Selamat datang di layanan otomatis BUMDes Banyubening.\n\n` +
        `Daftar Perintah Cepat:\n` +
        `• *#produk* : Lihat katalog produk BUMDes terkini\n` +
        `• *#program* : Lihat progres program kerja desa\n` +
        `• *#info* : Tampilkan menu bantuan ini\n\n` +
        `Untuk menyampaikan pengaduan atau pertanyaan langsung ke Admin, silakan ketik pesan biasa tanpa awalan tanda #. Tim Admin kami siap membalas pesan Anda!`;

      await fonnteService.queueMessage({
        target: cleanNumber,
        message: botReplyText,
        type: 'BOT_REPLY',
        retries: 0,
      });

      const savedBotReply = await pengaduanRepository.saveMessage({
        senderNumber: cleanNumber,
        senderName: 'Bot WhatsApp BUMDes',
        message: botReplyText,
        direction: 'OUTGOING',
        status: 'REPLIED',
      });
      emitPengaduanReply(savedBotReply);

      return {
        success: true,
        isBotReply: true,
        incoming: savedIncoming,
        botReply: savedBotReply,
      };
    }

    if (lower === '#produk' || lower === '/produk') {
      const topProducts = await prisma.product.findMany({
        where: { stock: { gt: 0 } },
        orderBy: { soldCount: 'desc' },
        take: 5,
      });

      let productListText = `*🛒 Produk Unggulan BUMDes Banyubening*\n\n`;
      if (topProducts.length === 0) {
        productListText += `Saat ini semua produk sedang dalam proses restock atau belum diunggah oleh Admin.`;
      } else {
        topProducts.forEach((p, index) => {
          productListText += `${index + 1}. *${p.name}*\n   Harga: Rp ${p.price.toLocaleString('id-ID')}\n   Stok: ${p.stock} ${p.unitName}\n\n`;
        });
      }
      productListText += `Kunjungi website resmi kami untuk informasi lengkap.`;

      await fonnteService.queueMessage({
        target: cleanNumber,
        message: productListText,
        type: 'BOT_REPLY',
        retries: 0,
      });

      const savedBotReply = await pengaduanRepository.saveMessage({
        senderNumber: cleanNumber,
        senderName: 'Bot WhatsApp BUMDes',
        message: productListText,
        direction: 'OUTGOING',
        status: 'REPLIED',
      });
      emitPengaduanReply(savedBotReply);

      return {
        success: true,
        isBotReply: true,
        incoming: savedIncoming,
        botReply: savedBotReply,
      };
    }

    if (lower === '#program' || lower === '/program') {
      const topPrograms = await prisma.programKerja.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      let progListText = `*📋 Program Kerja & Kemajuan BUMDes Banyubening*\n\n`;
      if (topPrograms.length === 0) {
        progListText += `Belum ada program kerja aktif yang dipublikasikan oleh Admin.`;
      } else {
        topPrograms.forEach((p, index) => {
          progListText += `${index + 1}. *${p.title}*\n   Tanggal: ${p.date}\n   Tim: ${p.teamName}\n\n`;
        });
      }
      progListText += `Lihat detail dokumentasi pada website resmi BUMDes Banyubening.`;

      await fonnteService.queueMessage({
        target: cleanNumber,
        message: progListText,
        type: 'BOT_REPLY',
        retries: 0,
      });

      const savedBotReply = await pengaduanRepository.saveMessage({
        senderNumber: cleanNumber,
        senderName: 'Bot WhatsApp BUMDes',
        message: progListText,
        direction: 'OUTGOING',
        status: 'REPLIED',
      });
      emitPengaduanReply(savedBotReply);

      return {
        success: true,
        isBotReply: true,
        incoming: savedIncoming,
        botReply: savedBotReply,
      };
    }

    // 3. Standard citizen Live Chat Pengaduan message
    return {
      success: true,
      isBotReply: false,
      incoming: savedIncoming,
    };
  }

  async getPublicChatHistory(senderNumber: string) {
    const cleanNumber = String(senderNumber || '').replace(/\D/g, '').trim();
    return pengaduanRepository.getConversationByNumber(cleanNumber);
  }
}

export const pengaduanService = new PengaduanService();
