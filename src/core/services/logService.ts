/** File logger with 7-day rotation (never throws into UI flows). */
import { Directory, File, Paths } from 'expo-file-system';

const LOG_FOLDER = 'logs';
const MAX_AGE_DAYS = 7;

function logsDir(): Directory {
  return new Directory(Paths.cache, LOG_FOLDER);
}

export function ensureLogsDir(): Directory {
  const dir = logsDir();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function todayKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function writeLog(scope: string, message: string, error?: unknown): void {
  try {
    const dir = ensureLogsDir();
    const file = new File(dir, `app-${todayKey()}.log`);
    const detail = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : error ? String(error) : '';
    const line = `[${new Date().toISOString()}] [${scope}] ${message}${detail ? ` :: ${detail}` : ''}\n`;
    if (!file.exists) file.create({ intermediates: true });
    file.write(file.exists ? `${file.textSync()}${line}` : line);
  } catch {
    // logging must never crash the app
  }
}

export function rotateLogs(maxAgeDays = MAX_AGE_DAYS): number {
  try {
    const dir = logsDir();
    if (!dir.exists) return 0;
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    let removed = 0;
    for (const entry of dir.list()) {
      if (!(entry instanceof File)) continue;
      const stamp = entry.creationTime ?? entry.modificationTime ?? 0;
      if (stamp > 0 && stamp < cutoff) {
        entry.delete();
        removed += 1;
      }
    }
    return removed;
  } catch {
    return 0;
  }
}

export function readLatestLogs(limit = 200): string {
  try {
    const dir = logsDir();
    if (!dir.exists) return '';
    const files = dir.list().filter((f): f is File => f instanceof File).sort((a, b) => a.name.localeCompare(b.name));
    const latest = files[files.length - 1];
    if (!latest) return '';
    return latest.textSync().split('\n').slice(-limit).join('\n');
  } catch {
    return '';
  }
}
