import http from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './config/pino';
import { connectDatabase, disconnectDatabase } from './config/database';
import { getRedisClient } from './config/redis';
import { initSocketIO } from './sockets/index';
import { initBackupCron } from './cron/backup.cron';
import { initThemeCron } from './cron/theme.cron';
import { startWhatsappWorker } from './modules/whatsapp/whatsapp.service';

async function bootstrap() {
  try {
    // Connect DB
    await connectDatabase();

    // Init Redis (non-blocking)
    getRedisClient();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Init Socket.IO - Realtime System
    const io = initSocketIO(httpServer);
    app.set('io', io);

    // Start crons
    initBackupCron();
    initThemeCron();

    // Start WhatsApp worker (queue + retry + logging)
    startWhatsappWorker();

    // Start server
    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 BUMDes BANYUBENING Backend running on port ${env.PORT}`);
      logger.info(`📊 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health: http://localhost:${env.PORT}/health`);
      logger.info(`📡 Realtime: Socket.IO enabled`);
      logger.info(`🎨 UI Composition: 60% Ocean Blue, 20% Light Green, 10% Red, 10% Orange`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      httpServer.close(async () => {
        await disconnectDatabase();
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, 'Uncaught exception');
      process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled rejection');
    });

  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
