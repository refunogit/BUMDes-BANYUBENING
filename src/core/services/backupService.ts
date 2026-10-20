/**
 * Backup & Restore 100% lokal (QA V5): ZIP berisi database + logo + foto
 * produk, dibuat ke cacheDirectory lalu dibagikan lewat Share Sheet.
 * Catatan: sesuai ralat v5, arsip lokal memakai ZIP polos (bukan AES).
 */
import JSZip from 'jszip';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';

import { closeDatabase, getDatabase, initDatabase } from '@/data/database';
import { clearSettingsCache } from '@/data/repositories/settingsRepository';
import { exportsDir, ensureDir, FOLDERS, folder } from './storageService';
import { writeLog } from './logService';
import { toDateKey } from '@/core/utils/date';

export const DB_RELATIVE_PATH = ['SQLite', 'bumdes.db'] as const;

function dbFile(): File {
  return new File(Paths.document, DB_RELATIVE_PATH[0], DB_RELATIVE_PATH[1]);
}

export type BackupProgress = 'idle' | 'compressing' | 'done' | 'error';

async function addDirectoryToZip(zip: JSZip, dir: Directory, prefix: string): Promise<number> {
  if (!dir.exists) return 0;
  let count = 0;
  for (const entry of dir.list()) {
    if (!(entry instanceof File)) continue;
    const base64 = entry.base64Sync();
    zip.file(`${prefix}/${entry.name}`, base64, { base64: true });
    count += 1;
  }
  return count;
}

export async function createBackupZip(onProgress?: (state: BackupProgress) => void): Promise<{ uri: string; fileName: string }> {
  onProgress?.('compressing');
  try {
    const db = await getDatabase();
    await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
    const file = dbFile();
    if (!file.exists) throw new Error('Database belum tersedia.');
    const zip = new JSZip();
    zip.file('bumdes.db', file.base64Sync(), { base64: true });
    const logos = await addDirectoryToZip(zip, folder(FOLDERS.logos), 'logos');
    const products = await addDirectoryToZip(zip, folder(FOLDERS.productImages), 'product_images');
    zip.file(
      'manifest.json',
      JSON.stringify(
        {
          app: 'KASIRKU',
          createdAt: new Date().toISOString(),
          database: 'bumdes.db',
          logos,
          productImages: products,
        },
        null,
        2,
      ),
    );
    const base64 = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const fileName = `backup_kasirku_${toDateKey(new Date())}_${Date.now()}.zip`;
    const target = new File(exportsDir(), fileName);
    if (target.exists) target.delete();
    target.create({ intermediates: true });
    target.write(base64, { encoding: 'base64' });
    writeLog('backup', `created ${fileName}`);
    onProgress?.('done');
    return { uri: target.uri, fileName };
  } catch (error) {
    writeLog('backup', 'create failed', error);
    onProgress?.('error');
    throw error;
  }
}

export async function pickBackupZip(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/x-zip-compressed'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets.length) return null;
  return result.assets[0].uri;
}

async function extractImages(zip: JSZip, prefix: string, folderName: string): Promise<number> {
  const targetFolder = folder(folderName);
  try {
    if (targetFolder.exists) targetFolder.delete();
  } catch {
    // ignore
  }
  ensureDir(folderName);
  const entries = zip.folder(prefix);
  if (!entries) return 0;
  let count = 0;
  const files = entries.file(/.*/);
  for (const entry of files) {
    if (entry.dir) continue;
    const base64 = await entry.async('base64');
    const name = entry.name.split('/').pop() ?? `file_${count}`;
    const target = new File(targetFolder, name);
    if (target.exists) target.delete();
    target.create({ intermediates: true });
    target.write(base64, { encoding: 'base64' });
    count += 1;
  }
  return count;
}

export async function restoreBackupZip(zipUri: string): Promise<{ database: boolean; logos: number; productImages: number }> {
  const source = new File(zipUri);
  if (!source.exists) throw new Error('Berkas backup tidak ditemukan.');
  const zip = await JSZip.loadAsync(source.base64Sync(), { base64: true });
  const dbEntry = zip.file('bumdes.db');
  if (!dbEntry) throw new Error('Arsip tidak memiliki basis data.');
  const dbBase64 = await dbEntry.async('base64');

  await closeDatabase();
  const target = dbFile();
  const parent = new Directory(Paths.document, DB_RELATIVE_PATH[0]);
  if (!parent.exists) parent.create({ intermediates: true, idempotent: true });
  // Hapus sisa WAL/SHM lama agar database hasil restore tidak korup.
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    const stale = new File(Paths.document, DB_RELATIVE_PATH[0], `${DB_RELATIVE_PATH[1]}${suffix}`);
    if (stale.exists) {
      try {
        stale.delete();
      } catch {
        // ignore
      }
    }
  }
  target.create({ intermediates: true });
  target.write(dbBase64, { encoding: 'base64' });

  const logos = await extractImages(zip, 'logos', FOLDERS.logos);
  const productImages = await extractImages(zip, 'product_images', FOLDERS.productImages);
  await initDatabase();
  clearSettingsCache();
  writeLog('backup', `restored db logos=${logos} products=${productImages}`);
  return { database: true, logos, productImages };
}
