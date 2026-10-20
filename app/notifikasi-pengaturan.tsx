import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { CenteredTitleHeader } from '@/shared/components/CenteredTitleHeader';
import { Card } from '@/shared/components/Card';
import { ThemedSwitch } from '@/shared/components/ThemedSwitch';
import { SecondaryButton } from '@/shared/components/SecondaryButton';
import { useTheme } from '@/store/themeStore';
import { getSetting, setBooleanSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { ensureNotificationPermission } from '@/features/notifications/notificationService';
import { formatDateTime } from '@/core/utils/date';
import { showBanner } from '@/store/bannerStore';

type HistoryRow = { title: string; body: string; at: string };

export default function NotifikasiPengaturanScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const [taskbar, setTaskbar] = useState(true);
  const [sound, setSound] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [sticky, setSticky] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const load = useCallback(async () => {
    setTaskbar((await getSetting(SETTINGS_KEYS.notifTaskbar)) !== '0');
    setSound((await getSetting(SETTINGS_KEYS.notifSound)) !== '0');
    setVibrate((await getSetting(SETTINGS_KEYS.notifVibrate)) !== '0');
    setSticky((await getSetting(SETTINGS_KEYS.notifSticky)) === '1');
    const raw = await getSetting(SETTINGS_KEYS.notifHistory);
    setHistory(raw ? (JSON.parse(raw) as HistoryRow[]) : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <CenteredTitleHeader title="Notifikasi" subtitle="Pengingat hutang & aktifitas penting" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <ThemedSwitch
            label="Notifikasi taskbar"
            hint="Izin diminta saat pertama menyimpan hutang"
            value={taskbar}
            onValueChange={async (value) => {
              setTaskbar(value);
              await setBooleanSetting(SETTINGS_KEYS.notifTaskbar, value);
              if (value) {
                const granted = await ensureNotificationPermission();
                if (!granted) showBanner('Izin notifikasi belum diberikan.', { type: 'warning' });
              }
            }}
          />
          <ThemedSwitch label="Suara" value={sound} onValueChange={async (value) => { setSound(value); await setBooleanSetting(SETTINGS_KEYS.notifSound, value); }} />
          <ThemedSwitch label="Getar" value={vibrate} onValueChange={async (value) => { setVibrate(value); await setBooleanSetting(SETTINGS_KEYS.notifVibrate, value); }} />
          <ThemedSwitch label="Sticky" value={sticky} onValueChange={async (value) => { setSticky(value); await setBooleanSetting(SETTINGS_KEYS.notifSticky, value); }} />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Riwayat Notifikasi</Text>
          {history.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>Belum ada notifikasi.</Text>
          ) : (
            history.map((row, index) => (
              <View key={`${row.at}-${index}`} style={[styles.row, { borderTopColor: colors.border }]}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{row.title}</Text>
                <Text style={[styles.rowBody, { color: colors.textMuted }]}>{row.body}</Text>
                <Text style={[styles.rowDate, { color: colors.textMuted }]}>{formatDateTime(row.at)}</Text>
              </View>
            ))
          )}
        </Card>

        <SecondaryButton label="Kembali" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '900' },
  empty: { fontSize: 11 },
  row: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, gap: 2 },
  rowTitle: { fontSize: 12, fontWeight: '800' },
  rowBody: { fontSize: 11 },
  rowDate: { fontSize: 10 },
});
