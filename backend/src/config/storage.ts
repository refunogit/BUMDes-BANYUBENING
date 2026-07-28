import fs from 'fs';
import path from 'path';
import { env } from './env';
import { logger } from './pino';

export interface StorageProvider {
  save(file: Express.Multer.File, subFolder: string): Promise<string>;
  delete(filePath: string): Promise<void>;
  exists(filePath: string): boolean;
}

class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(env.UPLOAD_DIR);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async save(file: Express.Multer.File, subFolder: string): Promise<string> {
    const folderPath = path.join(this.baseDir, subFolder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const fileName = `${uniqueSuffix}${ext}`;
    const fullPath = path.join(folderPath, fileName);

    await fs.promises.writeFile(fullPath, file.buffer);
    logger.info({ fullPath }, 'File saved');
    return `/uploads/${subFolder}/${fileName}`;
  }

  async delete(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.baseDir, filePath.replace('/uploads/', ''));
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (error) {
      logger.warn({ error, filePath }, 'Failed to delete file');
    }
  }

  exists(filePath: string): boolean {
    const fullPath = path.join(this.baseDir, filePath.replace('/uploads/', ''));
    return fs.existsSync(fullPath);
  }
}

// S3 Compatible abstraction placeholder for future extension
class S3StorageProvider implements StorageProvider {
  async save(): Promise<string> {
    throw new Error('S3 not configured - extend implementation');
  }
  async delete(): Promise<void> {}
  exists(): boolean { return false; }
}

export const storageProvider: StorageProvider = new LocalStorageProvider();

// Helper to determine which provider to use based on env
export function getStorageProvider(): StorageProvider {
  if (process.env.STORAGE_PROVIDER === 's3') {
    return new S3StorageProvider();
  }
  return new LocalStorageProvider();
}
