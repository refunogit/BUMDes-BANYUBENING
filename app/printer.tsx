import React, { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { SecondaryButton } from '@/shared/components/SecondaryButton';
import { ThemedSwitch } from '@/shared/components/ThemedSwitch';
import { SegmentedControl } from '@/shared/components/SegmentedControl';
import { AppIcon } from '@/shared/components/AppIcon';
import { useTheme } from '@/store/themeStore';
import { usePrinterStore } from '@/store/printerStore';
import { printerService } from '@/features/printer/printerService';
import { usePrintDialogStore } from '@/store/printDialogStore';
import { formatDate } from '@/core/utils/date';
import { showBanner } from '@/store/bannerStore';

export default function PrinterScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    status,
    devices,
    scanning,
    deviceName,
    mac,
    paperSize,
    autoPrint,
    history,
    scan,
    connect,
    disconnect,
    setPaperSize,
    setAutoPrint,
    refreshHistory,
    verify,
    initialize,
  } = usePrinterStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useFocusEffect(
    useCallback(() => {
      void verify();
      void refreshHistory();
    }, [refreshHistory, verify]),
  );

  const statusLabel = status === 'terhubung' ? 'Terhubung' : status === 'memverifikasi' ? 'Memverifikasi' : 'Terputus';
  const statusTone = status === 'terhubung' ? 'success' : status === 'memverifikasi' ? 'gold' : 'danger';

  const testPrint = async () => {
    const result = await printerService.testPrint('KASIRKU TEST PRINT\nESC/POS OK');
    if (!result.ok) {
      usePrintDialogStore.getState().open('not-connected', { message: 'Printer Tidak Terhubung' });
      return;
    }
    if (result.virtual) {
      usePrintDialogStore.getState().open('preview', { receiptText: result.text });
    } else {
      showBanner('Test print terkirim.', { type: 'success' });
    }
    await refreshHistory();
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <PageHeader title="Printer" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <View style={styles.statusRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Status Printer</Text>
            <Badge label={statusLabel} tone={statusTone as 'success' | 'gold' | 'danger'} />
          </View>
          <Text style={[styles.device, { color: colors.textMuted }]}>
            {deviceName ? `${deviceName} · ${mac}` : 'Belum ada printer terpasang'}
          </Text>
          <SecondaryButton
            label={scanning ? 'Memindai...' : 'Pindai Printer'}
            icon="printer_scan"
            onPress={() => void scan()}
            loading={scanning}
          />
          {devices.length > 0 ? (
            <View style={styles.deviceList}>
              {devices.map((device) => (
                <Pressable
                  key={device.mac}
                  onPress={async () => {
                    const ok = await connect(device);
                    showBanner(ok ? 'Printer terhubung.' : 'Gagal menghubungkan printer.', { type: ok ? 'success' : 'error' });
                    await refreshHistory();
                  }}
                  style={[styles.deviceRow, { borderColor: colors.border }]}
                >
                  <AppIcon name="printer_scan" size={20} />
                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, { color: colors.text }]}>{device.name}</Text>
                    <Text style={[styles.deviceMac, { color: colors.textMuted }]}>{device.mac}</Text>
                  </View>
                  <Text style={[styles.connect, { color: colors.primary }]}>Hubungkan</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <PrimaryButton label="Test Print" icon="printer_test" onPress={() => void testPrint()} disabled={status !== 'terhubung'} />
          {status === 'terhubung' ? (
            <SecondaryButton label="Putuskan" onPress={() => void disconnect()} color={colors.danger} />
          ) : null}
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ukuran Kertas</Text>
          <SegmentedControl
            value={paperSize}
            onChange={(value) => void setPaperSize(value)}
            options={[
              { value: '58', label: '58 mm (32 char)' },
              { value: '80', label: '80 mm (48 char)' },
            ]}
          />
          <ThemedSwitch
            label="Cetak Otomatis"
            hint="Cetak struk langsung setelah pembayaran"
            value={autoPrint}
            onValueChange={(value) => void setAutoPrint(value)}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Riwayat Koneksi (20 terakhir)</Text>
          {history.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>Belum ada riwayat.</Text>
          ) : (
            history.map((entry, index) => (
              <View key={`${entry.mac}-${index}`} style={[styles.historyRow, { borderTopColor: colors.border }]}>
                <View style={styles.deviceInfo}>
                  <Text style={[styles.deviceName, { color: colors.text }]}>{entry.name}</Text>
                  <Text style={[styles.deviceMac, { color: colors.textMuted }]}>
                    {formatDate(entry.connectedAt)} · {entry.prints} cetak
                  </Text>
                </View>
                <Text style={[styles.deviceMac, { color: colors.textMuted }]}>{entry.mac}</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '900' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  device: { fontSize: 11 },
  deviceList: { gap: 8 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, padding: 10 },
  deviceInfo: { flex: 1, gap: 1 },
  deviceName: { fontSize: 12, fontWeight: '800' },
  deviceMac: { fontSize: 10 },
  connect: { fontSize: 11, fontWeight: '800' },
  empty: { fontSize: 11 },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, gap: 8 },
});
