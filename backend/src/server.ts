import http from 'http';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { app } from './app';
import { initSocket } from './shared/socket';
import { logger } from './shared/logger';
import { googleDriveBackupService } from './shared/google-drive/backup.service';

dotenv.config();

const port = Number(process.env.PORT) || 4000;
const server = http.createServer(app);

// Initialize Socket.IO Realtime server
initSocket(server);

// Setup automated database backup cron job (Midnight every day: 0 0 * * *)
cron.schedule('0 0 * * *', async () => {
  logger.info('Running automated daily cron backup for BUMDes Banyubening database');
  try {
    const result = await googleDriveBackupService.createBackup('SYSTEM_CRON');
    logger.info({ backup: result }, 'Automated daily database backup completed successfully');
  } catch (err: any) {
    logger.error({ err: err.message }, 'Automated cron backup failed');
  }
});

server.listen(port, '0.0.0.0', () => {
  logger.info(`Enterprise BUMDes Banyubening Backend running on http://0.0.0.0:${port}`);
  logger.info(`Custom non-guessable Admin Gateway endpoint ready at /gerbang-internal-bumdes`);
});

export default server;
