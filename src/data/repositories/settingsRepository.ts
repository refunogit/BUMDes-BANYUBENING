import { all, first, run, withTransaction } from '@/data/database';
import type { SettingsKey } from '@/core/constants/settingsKeys';

type SettingRow = { key: string; value: string | null };

const cache = new Map<string, string | null>();

export async function getSetting(key: SettingsKey | string, fallback: string | null = null): Promise<string | null> {
  if (cache.has(key)) return cache.get(key) ?? fallback;
  const row = await first<SettingRow>('SELECT value FROM app_settings WHERE key = ?', [key]);
  const value = row?.value ?? null;
  cache.set(key, value);
  return value ?? fallback;
}

export async function setSetting(key: SettingsKey | string, value: string | null): Promise<void> {
  await run(
    `INSERT INTO app_settings (id, key, value, created_at, updated_at)
     VALUES (lower(hex(randomblob(16))), ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value],
  );
  cache.set(key, value);
}

export async function setManySettings(entries: Record<string, string | null>): Promise<void> {
  await withTransaction(async (db) => {
    for (const [key, value] of Object.entries(entries)) {
      await db.runAsync(
        `INSERT INTO app_settings (id, key, value, created_at, updated_at)
         VALUES (lower(hex(randomblob(16))), ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [key, value],
      );
      cache.set(key, value);
    }
  });
}

export async function getAllSettings(): Promise<Record<string, string | null>> {
  const rows = await all<SettingRow>('SELECT key, value FROM app_settings');
  const map: Record<string, string | null> = {};
  for (const row of rows) {
    map[row.key] = row.value;
    cache.set(row.key, row.value);
  }
  return map;
}

export async function getNumberSetting(key: SettingsKey | string, fallback = 0): Promise<number> {
  const raw = await getSetting(key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getBooleanSetting(key: SettingsKey | string, fallback = false): Promise<boolean> {
  const raw = await getSetting(key);
  if (raw === null) return fallback;
  return raw === '1' || raw.toLowerCase() === 'true';
}

export async function setBooleanSetting(key: SettingsKey | string, value: boolean): Promise<void> {
  await setSetting(key, value ? '1' : '0');
}

export async function getJsonSetting<T>(key: SettingsKey | string, fallback: T): Promise<T> {
  const raw = await getSetting(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJsonSetting(key: SettingsKey | string, value: unknown): Promise<void> {
  await setSetting(key, JSON.stringify(value));
}

export async function deleteSetting(key: SettingsKey | string): Promise<void> {
  await run('DELETE FROM app_settings WHERE key = ?', [key]);
  cache.delete(key);
}

export function clearSettingsCache(): void {
  cache.clear();
}
