import axios from 'axios';
import { logger } from '../logger';
import { cache } from '../redis/cache';

export interface WhatsAppMessageJob {
  target: string;
  message: string;
  retries?: number;
  type?: 'OTP' | 'PENGADUAN_REPLY' | 'BOT_REPLY';
}

class FonnteService {
  private apiUrl = process.env.FONNTE_API_URL || 'https://api.fonnte.com/send';
  private token = process.env.FONNTE_TOKEN || 'demo_fonnte_token_bumdes_banyubening';
  private isProcessingQueue = false;

  constructor() {
    // Start background queue processing every 3 seconds
    setInterval(() => {
      this.processQueue().catch((err) => logger.error({ err }, 'Error processing WhatsApp Fonnte queue'));
    }, 3000);
  }

  async sendOtp(phone: string, otpCode: string): Promise<boolean> {
    const message = `Kode OTP Anda: ${otpCode}. Berlaku 3 menit.`;
    logger.info({ phone, otpCode: process.env.NODE_ENV === 'development' ? otpCode : '***' }, 'Preparing to send OTP via Fonnte');
    return this.queueMessage({
      target: phone,
      message,
      type: 'OTP',
      retries: 0,
    });
  }

  async sendPengaduanReply(phone: string, replyText: string): Promise<boolean> {
    const message = `[BUMDes Banyubening Pengaduan Response]\n\n${replyText}\n\nTerima kasih,\nTim Layanan Pengaduan BUMDes Banyubening`;
    return this.queueMessage({
      target: phone,
      message,
      type: 'PENGADUAN_REPLY',
      retries: 0,
    });
  }

  async queueMessage(job: WhatsAppMessageJob): Promise<boolean> {
    try {
      await cache.lpush('wa_message_queue', JSON.stringify(job));
      logger.info({ target: job.target, type: job.type }, 'Message queued for Fonnte delivery');
      return true;
    } catch (err: any) {
      logger.error({ err: err.message }, 'Failed to push WhatsApp job to queue');
      return false;
    }
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      const rawJob = await cache.rpop('wa_message_queue');
      if (!rawJob) {
        this.isProcessingQueue = false;
        return;
      }

      const job: WhatsAppMessageJob = JSON.parse(rawJob);

      // If in demo mode or using demo token, simulate success
      if (
        !this.token ||
        this.token === 'demo_fonnte_token_bumdes_banyubening' ||
        process.env.NODE_ENV === 'test'
      ) {
        logger.info(
          { target: job.target, type: job.type, preview: job.message.slice(0, 50) },
          '[DEMO MODE] Fonnte WhatsApp message sent successfully via simulated gateway'
        );
        this.isProcessingQueue = false;
        return;
      }

      try {
        const response = await axios.post(
          this.apiUrl,
          {
            target: job.target,
            message: job.message,
          },
          {
            headers: {
              Authorization: this.token,
            },
            timeout: 10000,
          }
        );

        if (response.data && response.data.status) {
          logger.info({ target: job.target, type: job.type }, 'Fonnte WhatsApp message delivered successfully');
        } else {
          throw new Error(response.data?.reason || 'Fonnte returned false status');
        }
      } catch (err: any) {
        logger.warn(
          { target: job.target, err: err.message, retries: job.retries },
          'Fonnte delivery failed, checking retry policy'
        );

        const retries = (job.retries || 0) + 1;
        if (retries <= 3) {
          job.retries = retries;
          await cache.lpush('wa_message_queue', JSON.stringify(job));
        } else {
          logger.error({ job }, 'Max retries exceeded for Fonnte message delivery');
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }
}

export const fonnteService = new FonnteService();
