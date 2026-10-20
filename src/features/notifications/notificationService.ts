/** Local notifications (offline). Permission is requested lazily at first use. */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getSetting, setSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { writeLog } from '@/core/services/logService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (error) {
    writeLog('notifications', 'permission failed', error);
    return false;
  }
}

export async function notify(title: string, body: string): Promise<void> {
  try {
    const enabled = (await getSetting(SETTINGS_KEYS.notifTaskbar)) !== '0';
    if (!enabled) return;
    const granted = await ensureNotificationPermission();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: (await getSetting(SETTINGS_KEYS.notifSound)) !== '0',
        vibrate: (await getSetting(SETTINGS_KEYS.notifVibrate)) !== '0' ? [0, 180, 120, 180] : undefined,
        sticky: (await getSetting(SETTINGS_KEYS.notifSticky)) === '1',
        data: { source: 'kasirku' },
      },
      trigger: null,
    });
    const historyRaw = await getSetting(SETTINGS_KEYS.notifHistory);
    const history = historyRaw ? (JSON.parse(historyRaw) as { title: string; body: string; at: string }[]) : [];
    history.unshift({ title, body, at: new Date().toISOString() });
    await setSetting(SETTINGS_KEYS.notifHistory, JSON.stringify(history.slice(0, 30)));
  } catch (error) {
    writeLog('notifications', 'notify failed', error);
  }
}

export async function notifyHutangAdded(name: string): Promise<void> {
  await notify('Hutang baru ditambahkan', `Hutang atas nama ${name} berhasil dicatat.`);
}

export async function notifyHutangPaid(name: string): Promise<void> {
  await notify('Hutang Lunas', `Hutang atas nama ${name} sudah lunas.`);
}

export function androidChannelSetup(): void {
  if (Platform.OS !== 'android') return;
  void Notifications.setNotificationChannelAsync('default', {
    name: 'KASIRKU',
    importance: Notifications.AndroidImportance.DEFAULT,
  }).catch(() => undefined);
}
