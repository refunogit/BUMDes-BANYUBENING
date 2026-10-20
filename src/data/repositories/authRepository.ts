/**
 * Authentication repository — PIN numerik 6 digit only (bcrypt cost 10).
 * No biometrics by design: works on every device.
 */
import bcrypt from 'bcryptjs';

import '@/core/utils/cryptoPolyfill';

import { all, first, run, truncateAllTables } from '@/data/database';
import { newId, nowIso } from '@/core/utils/id';
import { clearSecureStore, secureGet, secureSet, SECURE_KEYS } from '@/core/services/secureStore';
import { clearSettingsCache } from './settingsRepository';
import { clearCache, deleteDirectorySafe, folder, initStorage, FOLDERS } from '@/core/services/storageService';

import '@/core/utils/cryptoPolyfill';

export type User = {
  id: string;
  username: string;
  pin_hash: string;
  role: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export const BCRYPT_ROUNDS = 10;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

export async function comparePin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function hasUsers(): Promise<boolean> {
  const row = await first<{ count: number }>('SELECT COUNT(*) as count FROM users');
  return (row?.count ?? 0) > 0;
}

export async function getUserCount(): Promise<number> {
  const row = await first<{ count: number }>('SELECT COUNT(*) as count FROM users');
  return row?.count ?? 0;
}

export async function getPrimaryUser(): Promise<User | null> {
  return first<User>("SELECT * FROM users ORDER BY CASE role WHEN 'admin' THEN 0 ELSE 1 END, created_at ASC LIMIT 1");
}

export async function getSessionUser(): Promise<User | null> {
  const id = await secureGet(SECURE_KEYS.sessionUserId);
  if (!id) return null;
  return first<User>('SELECT * FROM users WHERE id = ?', [id]);
}

export async function getUserById(id: string): Promise<User | null> {
  return first<User>('SELECT * FROM users WHERE id = ?', [id]);
}

export type SetupInput = {
  username: string;
  pin: string;
  displayName: string;
  role?: 'admin' | 'kasir';
};

export async function setupUser(input: SetupInput): Promise<User> {
  const now = nowIso();
  const id = newId();
  const hash = await hashPin(input.pin);
  await run(
    `INSERT INTO users (id, username, pin_hash, role, display_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.username.trim().toLowerCase(), hash, input.role ?? 'admin', input.displayName.trim(), now, now],
  );
  await secureSet(SECURE_KEYS.dbKey, `${newId()}${newId()}`.replace(/-/g, ''));
  await secureSet(SECURE_KEYS.sessionUserId, id);
  return (await getUserById(id))!;
}

/** Verify PIN for login. Returns the matching user or null. */
export async function verifyPin(pin: string, userId?: string): Promise<User | null> {
  const user = userId ? await getUserById(userId) : await getPrimaryUser();
  if (!user) return null;
  const ok = await comparePin(pin, user.pin_hash);
  return ok ? user : null;
}

export async function verifyPinForUser(userId: string, pin: string): Promise<boolean> {
  return (await verifyPin(pin, userId)) !== null;
}

export async function setSession(userId: string): Promise<void> {
  await secureSet(SECURE_KEYS.sessionUserId, userId);
}

export async function clearSession(): Promise<void> {
  await clearSecureStore();
}

export async function updateUsername(userId: string, username: string): Promise<void> {
  await run('UPDATE users SET username = ?, updated_at = ? WHERE id = ?', [
    username.trim().toLowerCase(),
    nowIso(),
    userId,
  ]);
}

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  await run('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?', [displayName, nowIso(), userId]);
}

export async function updatePin(userId: string, pin: string): Promise<void> {
  const hash = await hashPin(pin);
  await run('UPDATE users SET pin_hash = ?, updated_at = ? WHERE id = ?', [hash, nowIso(), userId]);
}

export async function usernameExists(username: string): Promise<boolean> {
  const rows = await all<{ id: string }>('SELECT id FROM users WHERE lower(username) = ?', [username.trim().toLowerCase()]);
  return rows.length > 0;
}

/**
 * Factory reset: wipes all tables, secure storage and uploaded images.
 * Logout always performs this (PRD: logout = factory reset).
 */
export async function deleteAllData(): Promise<void> {
  await truncateAllTables();
  await clearSecureStore();
  clearSettingsCache();
  deleteDirectorySafe(folder(FOLDERS.logos));
  deleteDirectorySafe(folder(FOLDERS.productImages));
  try {
    clearCache();
  } catch {
    // ignore
  }
  await initStorage();
}
