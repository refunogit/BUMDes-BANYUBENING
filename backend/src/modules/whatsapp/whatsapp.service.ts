import { prisma } from '../../config/database';
import { queueService } from '../../config/redis';
import { logger } from '../../config/pino';
import { env } from '../../config/env';

export interface WhatsAppCommand {
  command: string;
  args: string[];
  from: string;
}

export const whatsappService = {
  async getConfig() {
    let config = await prisma.whatsappConfig.findFirst();
    if (!config) {
      // try from setting
      const phone = await prisma.setting.findUnique({ where: { key: 'WHATSAPP_NUMBER' } });
      const apiKey = await prisma.setting.findUnique({ where: { key: 'WHATSAPP_API_KEY' } });
      return {
        phoneNumber: phone?.value || env.WHATSAPP_API_URL ? 'configured' : '',
        apiKey: apiKey?.value || env.WHATSAPP_API_KEY,
        isActive: !!phone,
      };
    }
    return config;
  },

  async updateConfig(data: any) {
    const existing = await prisma.whatsappConfig.findFirst();
    let config;
    if (existing) {
      config = await prisma.whatsappConfig.update({ where: { id: existing.id }, data });
    } else {
      config = await prisma.whatsappConfig.create({ data });
    }

    // Also sync to settings
    await prisma.setting.upsert({
      where: { key: 'WHATSAPP_NUMBER' },
      update: { value: data.phoneNumber },
      create: { key: 'WHATSAPP_NUMBER', value: data.phoneNumber },
    });

    return config;
  },

  async enqueueMessage(to: string, message: string) {
    const log = await prisma.whatsappLog.create({
      data: { to, message, status: 'PENDING' },
    });

    await queueService.enqueue('whatsapp:send', {
      id: log.id,
      to,
      message,
      retries: 0,
    });

    logger.info({ to, id: log.id }, 'WhatsApp message enqueued');
    return log;
  },

  async processQueue() {
    // Worker that processes whatsapp queue with retry mechanism
    const job = await queueService.dequeue('whatsapp:send');
    if (!job) return null;

    const { id, to, message, retries } = job;

    try {
      // Simulate API call - in production replace with actual WhatsApp API (e.g., Wablas, Fonnte, Twilio)
      const config = await this.getConfig();
      
      if (env.WHATSAPP_API_URL && env.WHATSAPP_API_KEY) {
        // Real API call would go here
        logger.info({ to, apiUrl: env.WHATSAPP_API_URL }, 'Sending WhatsApp via API');
        // Mock success for now; in production use fetch
        // const response = await fetch(env.WHATSAPP_API_URL, { method:'POST', ... })
      }

      // For demo, mark as sent
      await prisma.whatsappLog.update({
        where: { id },
        data: { status: 'SENT', sentAt: new Date(), response: 'Mock sent - configure real API in .env' },
      });

      logger.info({ to, id }, 'WhatsApp sent');
      return { success: true, id };
    } catch (error: any) {
      const newRetries = (retries || 0) + 1;
      if (newRetries < 3) {
        await queueService.enqueue('whatsapp:send', { id, to, message, retries: newRetries });
        await prisma.whatsappLog.update({
          where: { id },
          data: { status: 'RETRY', retries: newRetries, response: error.message },
        });
        logger.warn({ to, id, retries: newRetries }, 'WhatsApp retry enqueued');
      } else {
        await prisma.whatsappLog.update({
          where: { id },
          data: { status: 'FAILED', retries: newRetries, response: error.message },
        });
        logger.error({ to, id }, 'WhatsApp failed after retries');
      }
      return { success: false, id, error: error.message };
    }
  },

  async getLogs(query: any) {
    const { page = 1, limit = 20, status } = query;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.whatsappLog.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.whatsappLog.count({ where }),
    ]);

    return { data, total, page: parseInt(page), limit: parseInt(limit) };
  },

  // Command handler for bot
  parseCommand(text: string, from: string): WhatsAppCommand | null {
    const trimmed = text.trim();
    if (!trimmed.startsWith('/')) return null;
    
    const parts = trimmed.slice(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    return { command, args, from };
  },

  async handleCommand(cmd: WhatsAppCommand): Promise<string> {
    switch (cmd.command) {
      case 'help':
        return `🤖 BUMDes BANYUBENING Bot\n\nPerintah tersedia:\n/help - Bantuan\n/info - Info BUMDes\n/produk - List produk\n/artikel - Artikel terbaru\n/keuangan - Ringkasan keuangan\n/pengurus - Daftar pengurus`;

      case 'info':
        const identity = await prisma.identity.findFirst();
        return `🏢 ${identity?.name || 'BUMDes BANYUBENING'}\n📍 ${identity?.address || ''}\n📞 ${identity?.phone || ''}\n📧 ${identity?.email || ''}`;

      case 'produk':
        const products = await prisma.product.findMany({ where: { isActive: true }, take: 5, orderBy: { soldCount: 'desc' } });
        if (products.length === 0) return 'Belum ada produk tersedia';
        return `🛍️ Produk Terlaris:\n` + products.map(p => `- ${p.name} Rp ${Number(p.price).toLocaleString('id-ID')} (Stok: ${p.stock})`).join('\n');

      case 'artikel':
        const articles = await prisma.article.findMany({ where: { isPublished: true }, take: 3, orderBy: { createdAt: 'desc' } });
        if (articles.length === 0) return 'Belum ada artikel';
        return `📰 Artikel Terbaru:\n` + articles.map(a => `- ${a.title}`).join('\n');

      case 'pengurus':
        const pengurus = await prisma.pengurus.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
        return `👥 Pengurus:\n` + pengurus.map(p => `- ${p.name} (${p.roleLabel})`).join('\n');

      case 'keuangan':
        return `💰 Ringkasan keuangan tersedia di website resmi. Hubungi admin untuk detail.`;

      default:
        return `❓ Perintah /${cmd.command} tidak dikenal. Ketik /help untuk bantuan`;
    }
  },

  async simulateIncomingMessage(from: string, text: string) {
    const cmd = this.parseCommand(text, from);
    let reply: string;
    if (cmd) {
      reply = await this.handleCommand(cmd);
    } else {
      reply = `Halo! Terima kasih telah menghubungi BUMDes BANYUBENING. Ketik /help untuk melihat perintah yang tersedia.`;
    }

    // Enqueue reply
    await this.enqueueMessage(from, reply);
    return reply;
  },
};

// Auto process queue every 5 seconds if not using external worker
let interval: NodeJS.Timeout | null = null;
export function startWhatsappWorker() {
  if (interval) return;
  interval = setInterval(async () => {
    try {
      await whatsappService.processQueue();
    } catch (e) {
      logger.error({ e }, 'Whatsapp worker error');
    }
  }, 5000);
  logger.info('📱 WhatsApp worker started (queue + retry + logging)');
}

export function stopWhatsappWorker() {
  if (interval) clearInterval(interval);
  interval = null;
}
