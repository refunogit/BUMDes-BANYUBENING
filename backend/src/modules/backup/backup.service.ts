import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '../../config/database';
import { logger } from '../../config/pino';
import { env } from '../../config/env';

const execAsync = promisify(exec);

export const backupService = {
  async list() {
    const logs = await prisma.backupLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return logs;
  },

  async createManualBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.sql`;
    const backupDir = path.resolve(env.BACKUP_DIR);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filePath = path.join(backupDir, fileName);

    try {
      // Try pg_dump if available, else export JSON dump of critical tables
      let fileSize = 0;

      try {
        // Attempt pg_dump using DATABASE_URL
        await execAsync(`pg_dump "${env.DATABASE_URL}" > "${filePath}"`);
        const stats = fs.statSync(filePath);
        fileSize = stats.size;
        logger.info({ fileName, fileSize }, 'pg_dump backup created');
      } catch (pgError) {
        // Fallback: JSON dump
        logger.warn({ pgError }, 'pg_dump failed, creating JSON dump fallback');

        const data = {
          identity: await prisma.identity.findMany(),
          users: await prisma.user.findMany({ select: { id: true, username: true, email: true, role: true, createdAt: true } }),
          articles: await prisma.article.findMany(),
          programKerja: await prisma.programKerja.findMany(),
          pengurus: await prisma.pengurus.findMany(),
          products: await prisma.product.findMany({ include: { images: true } }),
          coa: await prisma.coa.findMany(),
          journals: await prisma.journal.findMany({ include: { entries: true } }),
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        };

        fs.writeFileSync(filePath.replace('.sql', '.json'), JSON.stringify(data, null, 2));
        const stats = fs.statSync(filePath.replace('.sql', '.json'));
        fileSize = stats.size;
      }

      const log = await prisma.backupLog.create({
        data: {
          fileName,
          filePath: filePath.replace('.sql', '.json') ? filePath : filePath,
          fileSize,
          status: 'SUCCESS',
          type: 'MANUAL',
        },
      });

      return log;
    } catch (error: any) {
      logger.error({ error }, 'Backup failed');

      const log = await prisma.backupLog.create({
        data: {
          fileName,
          filePath,
          status: 'FAILED',
          type: 'MANUAL',
        },
      });

      throw error;
    }
  },

  async restoreFromFile(fileName: string) {
    // Security: only allow files from backup dir
    const backupDir = path.resolve(env.BACKUP_DIR);
    const filePath = path.join(backupDir, path.basename(fileName));

    if (!fs.existsSync(filePath)) {
      throw new Error('Backup file not found');
    }

    logger.info({ filePath }, 'Restore initiated');

    // For JSON backup, restore logic would parse and upsert
    // For SQL backup, use psql
    if (filePath.endsWith('.json')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      // Note: In production, implement careful restore with transaction
      logger.info('JSON restore parsed - manual review required in production');
      return { message: 'JSON backup verified, manual restore required for safety', dataKeys: Object.keys(data) };
    } else {
      try {
        await execAsync(`psql "${env.DATABASE_URL}" < "${filePath}"`);
        logger.info('SQL restore completed');
        return { message: 'Restore completed successfully' };
      } catch (error: any) {
        logger.error({ error }, 'Restore failed');
        throw new Error(`Restore failed: ${error.message}`);
      }
    }
  },

  async getVersionedBackups() {
    const backupDir = path.resolve(env.BACKUP_DIR);
    if (!fs.existsSync(backupDir)) return [];

    const files = fs.readdirSync(backupDir);
    return files
      .filter(f => f.startsWith('backup-'))
      .map(f => {
        const fullPath = path.join(backupDir, f);
        const stats = fs.statSync(fullPath);
        return {
          fileName: f,
          size: stats.size,
          createdAt: stats.mtime,
          path: fullPath,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async cleanupOldBackups(keepDays = 30) {
    const backupDir = path.resolve(env.BACKUP_DIR);
    if (!fs.existsSync(backupDir)) return;

    const files = fs.readdirSync(backupDir);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - keepDays);

    let deleted = 0;
    for (const file of files) {
      const fullPath = path.join(backupDir, file);
      const stats = fs.statSync(fullPath);
      if (stats.mtime < cutoff) {
        fs.unlinkSync(fullPath);
        deleted++;
      }
    }

    logger.info({ deleted, keepDays }, 'Old backups cleaned');
    return { deleted };
  },
};
