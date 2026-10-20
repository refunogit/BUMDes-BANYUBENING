/**
 * storageService — directories, sizes, safe cache clearing and the automatic
 * daily maintenance (cache + orphan files + logs > 7 days) that runs once per
 * calendar day at startup. Manual "Penyimpanan" menu intentionally removed.
 *
 * Layout:
 *   document/logos/            (bumdes_logo, pln_logo, qris)
 *   document/product_images/   (foto produk terkompresi)
 *   document/backups/          (arsip backup, bila ada)
 *   cache/logs/                (log rotasi 7 hari)
 *   cache/exports/             (PDF/CSV/ZIP sementara — selalu cacheDirectory)
 */
import { Directory, File, Paths } from 'expo-file-system';

import { getSetting, setSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { toDateKey } from '@/core/utils/date';
import { rotateLogs, writeLog } from './logService';

export const FOLDERS = {
  logos: 'logos',
  productImages: 'product_images',
  backups: 'backups',
  logs: 'logs',
  exports: 'exports',
} as const;

export function documentDir(): Directory {
  return Paths.document;
}

export function cacheDir(): Directory {
  return Paths.cache;
}

export function folder(name: string, base: 'document' | 'cache' = 'document'): Directory {
  return new Directory(base === 'document' ? Paths.document : Paths.cache, name);
}

export function ensureDir(name: string, base: 'document' | 'cache' = 'document'): Directory {
  const dir = folder(name, base);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export async function initStorage(): Promise<void> {
  ensureDir(FOLDERS.logos);
  ensureDir(FOLDERS.productImages);
  ensureDir(FOLDERS.backups);
  ensureDir(FOLDERS.logs, 'cache');
  ensureDir(FOLDERS.exports, 'cache');
}

export function logosDir(): Directory {
  return ensureDir(FOLDERS.logos);
}

export function productImagesDir(): Directory {
  return ensureDir(FOLDERS.productImages);
}

export function backupsDir(): Directory {
  return ensureDir(FOLDERS.backups);
}

export function exportsDir(): Directory {
  return ensureDir(FOLDERS.exports, 'cache');
}

export function exportsPath(fileName: string): string {
  return new File(exportsDir(), fileName).uri;
}

export function createCacheFile(folderName: string, fileName: string): File {
  const dir = ensureDir(folderName, 'cache');
  const file = new File(dir, fileName);
  if (file.exists) file.delete();
  file.create({ intermediates: true });
  return file;
}

export function fileExists(uri: string | null | undefined): boolean {
  if (!uri) return false;
  try {
    if (uri.startsWith('file://')) return new File(uri).exists;
    return false;
  } catch {
    return false;
  }
}

export function deleteFileSafe(uri: string | null | undefined): boolean {
  if (!uri) return false;
  try {
    const file = new File(uri);
    if (!file.exists) return false;
    file.delete();
    return true;
  } catch {
    return false;
  }
}

export function deleteDirectorySafe(dir: Directory): void {
  try {
    if (dir.exists) dir.delete();
  } catch {
    // ignore
  }
}

/** Copy a (already compressed) image into the app's private folders. */
export function copyIntoFolder(sourceUri: string, target: Directory, fileName: string): string {
  const source = new File(sourceUri);
  if (!source.exists) throw new Error('File sumber tidak ditemukan.');
  const dest = new File(target, fileName);
  if (dest.exists) dest.delete();
  source.copy(dest);
  return dest.uri;
}

export function copyToLogos(sourceUri: string, fileName: string): string {
  return copyIntoFolder(sourceUri, logosDir(), fileName);
}

export function copyToProductImages(sourceUri: string, fileName: string): string {
  return copyIntoFolder(sourceUri, productImagesDir(), fileName);
}

export function getDirectorySize(dir: Directory): number {
  try {
    if (!dir.exists) return 0;
    let total = 0;
    for (const entry of dir.list()) {
      if (entry instanceof File) total += entry.size ?? 0;
      else total += getDirectorySize(entry);
    }
    return total;
  } catch {
    return 0;
  }
}

export type StorageUsage = {
  documents: number;
  cache: number;
  logs: number;
  exports: number;
  productImages: number;
  logos: number;
};

export function getSize(): StorageUsage {
  return {
    documents: getDirectorySize(Paths.document),
    cache: getDirectorySize(Paths.cache),
    logs: getDirectorySize(folder(FOLDERS.logs, 'cache')),
    exports: getDirectorySize(folder(FOLDERS.exports, 'cache')),
    productImages: getDirectorySize(folder(FOLDERS.productImages)),
    logos: getDirectorySize(folder(FOLDERS.logos)),
  };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 1).replace('.', ',')} ${units[index]}`;
}

/**
 * Safe cache clear: only cacheDirectory (exports/logs) is touched.
 * User data lives in documentDirectory and is never removed here.
 */
export function clearCache(): number {
  const freed = getDirectorySize(folder(FOLDERS.exports, 'cache')) + getDirectorySize(folder(FOLDERS.logs, 'cache'));
  deleteDirectorySafe(folder(FOLDERS.exports, 'cache'));
  deleteDirectorySafe(folder(FOLDERS.logs, 'cache'));
  ensureDir(FOLDERS.exports, 'cache');
  ensureDir(FOLDERS.logs, 'cache');
  return freed;
}

async function removeOrphanImages(): Promise<number> {
  try {
    const { all } = await import('@/data/database');
    const rows = await all<{ image_path: string | null }>(
      'SELECT image_path FROM products WHERE image_path IS NOT NULL',
    );
    const referenced = new Set(rows.map((r) => r.image_path).filter((p): p is string => Boolean(p)));
    const dir = folder(FOLDERS.productImages);
    if (!dir.exists) return 0;
    let removed = 0;
    for (const entry of dir.list()) {
      if (!(entry instanceof File)) continue;
      if (!referenced.has(entry.uri)) {
        entry.delete();
        removed += 1;
      }
    }
    return removed;
  } catch {
    return 0;
  }
}

async function removeUnusedLogos(): Promise<number> {
  try {
    const used = new Set<string>();
    for (const key of [SETTINGS_KEYS.bumdesLogo, SETTINGS_KEYS.plnLogo, SETTINGS_KEYS.qrisImage]) {
      const value = await getSetting(key);
      if (value) used.add(value);
    }
    const dir = folder(FOLDERS.logos);
    if (!dir.exists) return 0;
    let removed = 0;
    for (const entry of dir.list()) {
      if (!(entry instanceof File)) continue;
      if (!used.has(entry.uri)) {
        entry.delete();
        removed += 1;
      }
    }
    return removed;
  } catch {
    return 0;
  }
}

export type DailyCleanResult = {
  ran: boolean;
  freedBytes: number;
  orphans: number;
  logos: number;
  logs: number;
};

/**
 * Runs at most once per calendar day (compares last_cache_clean_date with
 * today's local date). Safe to call on every startup.
 */
export async function dailyCacheClean(force = false): Promise<DailyCleanResult> {
  const today = toDateKey(new Date());
  const last = await getSetting(SETTINGS_KEYS.lastCacheCleanDate);
  if (!force && last === today) {
    return { ran: false, freedBytes: 0, orphans: 0, logos: 0, logs: 0 };
  }
  const sizeBefore = getDirectorySize(folder(FOLDERS.exports, 'cache')) + getDirectorySize(folder(FOLDERS.logs, 'cache'));
  const freed = clearCache();
  const orphanImages = await removeOrphanImages();
  const orphanLogos = await removeUnusedLogos();
  const rotated = rotateLogs(7);
  await setSetting(SETTINGS_KEYS.lastCacheCleanDate, today);
  writeLog('storage', `daily clean freed=${freed} cacheBefore=${sizeBefore} orphans=${orphanImages} logos=${orphanLogos} logs=${rotated}`);
  return { ran: true, freedBytes: freed, orphans: orphanImages, logos: orphanLogos, logs: rotated };
}

export async function copyBackupFile(uri: string, fileName: string): Promise<string> {
  return copyIntoFolder(uri, backupsDir(), fileName);
}
