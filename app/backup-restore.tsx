import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';

import { Screen } from '@/shared/components/Screen';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { SecondaryButton } from '@/shared/components/SecondaryButton';
import { LoadingOverlay } from '@/shared/components/LoadingOverlay';
import { useTheme } from '@/store/themeStore';
import { createBackupZip, pickBackupZip, restoreBackupZip } from '@/core/services/backupService';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';

export default function BackupRestoreScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);

  const shareBackup = async () => {
    setBusy('backup');
    try {
      const { uri, fileName } = await createBackupZip();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/zip', dialogTitle: 'Bagikan backup KASIRKU' });
      }
      hapticSuccess();
      showBanner(`Backup dibuat: ${fileName}`, { type: 'success' });
    } catch {
      showBanner('Gagal membuat backup.', { type: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    const uri = await pickBackupZip();
    if (!uri) return;
    setBusy('restore');
    try {
      const result = await restoreBackupZip(uri);
      hapticSuccess();
      showBanner(`Restore Berhasil — DB + ${result.logos} logo + ${result.productImages} foto. WAJIB restart aplikasi.`, {
        type: 'success',
        duration: 8000,
      });
    } catch {
      showBanner('Gagal memulihkan backup. Pastikan berkas .zip valid.', { type: 'error' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <PageHeader title="Backup & Restore" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Backup Lokal</Text>
            <Badge label="100% Offline" tone="success" />
          </View>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            Membuat arsip .zip berisi database, logo, dan foto produk. Simpan ke penyimpanan perangkat atau bagikan lewat
            aplikasi lain.
          </Text>
          <PrimaryButton label="Buat & Bagikan Backup" icon="set_backup" onPress={() => void shareBackup()} loading={busy === 'backup'} />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Restore</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            Pilih berkas backup .zip. Data saat ini akan ditimpa. Setelah restore, tutup dan buka kembali aplikasi.
          </Text>
          <SecondaryButton label="Pilih Berkas .zip" icon="register_upload" onPress={() => void restore()} loading={busy === 'restore'} />
        </Card>

        <Card style={[styles.warning, { borderColor: colors.gold }]}>
          <Text style={[styles.warningText, { color: colors.text }]}>
            Peringatan: restore menimpa seluruh data. Buat backup terbaru sebelum melanjutkan.
          </Text>
        </Card>
      </ScrollView>
      <LoadingOverlay
        visible={busy !== null}
        label={busy === 'backup' ? 'Membuat backup...' : 'Memulihkan backup...'}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '900' },
  text: { fontSize: 12, lineHeight: 18 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  warning: { borderWidth: 1.5, borderRadius: 12, padding: 14 },
  warningText: { fontSize: 12, lineHeight: 18 },
});
