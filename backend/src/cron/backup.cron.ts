import cron from 'node-cron';
import { backupService } from '../modules/backup/backup.service';
import { logger } from '../config/pino';
import { env } from '../config/env';

export function initBackupCron() {
  const schedule = env.BACKUP_CRON || '0 2 * * *';
  
  if (!cron.validate(schedule)) {
    logger.warn(`Invalid cron schedule: ${schedule}, using default 0 2 * * *`);
    return;
  }

  cron.schedule(schedule, async () => {
    logger.info('⏰ Running automated backup...');
    try {
      const backup = await backupService.createManualBackup();
      logger.info({ backup: backup.fileName }, '✅ Automated backup completed');

      // Cleanup old backups (keep 30 days)
      await backupService.cleanupOldBackups(30);
    } catch (error) {
      logger.error({ error }, '❌ Automated backup failed');
    }
  });

  logger.info(`📅 Backup cron scheduled: ${schedule}`);
}

// If run directly
if (require.main === module) {
  (async () => {
    await backupService.createManualBackup();
    process.exit(0);
  })();
}
