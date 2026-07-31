import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { googleDriveBackupService } from '../../shared/google-drive/backup.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export class BackupController {
  async getHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const list = await googleDriveBackupService.listBackups();
      return res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async triggerManualBackup(req: AuthenticatedRequest, res: Response) {
    try {
      const performedBy = req.user?.email || 'ADMIN';
      const result = await googleDriveBackupService.createBackup(performedBy);
      return res.status(201).json({
        success: true,
        data: result,
        message: 'Cadangan database (backup) berhasil dibuat dan dicatat.',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async restoreBackup(req: AuthenticatedRequest, res: Response) {
    try {
      const { backupId } = req.body;
      const performedBy = req.user?.email || 'ADMIN';
      const result = await googleDriveBackupService.restoreBackup(String(backupId), performedBy);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async downloadBackup(req: AuthenticatedRequest, res: Response) {
    try {
      const filename = String(req.params.filename);
      const backupsDir = path.resolve(__dirname, '../../../../backups');
      const filePath = path.join(backupsDir, path.basename(filename));

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File arsip backup tidak ditemukan di server lokal.' });
      }

      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.sendFile(filePath);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const backupController = new BackupController();
