/** Secure storage for session_user_id + db_key (expo-secure-store). */
import * as SecureStore from 'expo-secure-store';

export const SECURE_KEYS = {
  sessionUserId: 'session_user_id',
  dbKey: 'db_key',
} as const;

export async function secureSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function secureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function secureDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

export async function clearSecureStore(): Promise<void> {
  await secureDelete(SECURE_KEYS.sessionUserId);
  await secureDelete(SECURE_KEYS.dbKey);
}
