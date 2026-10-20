import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card } from '@/shared/components/Card';
import { ImagePickField } from '@/shared/components/ImagePickField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { useTheme } from '@/store/themeStore';
import { getSetting, setSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { compressLogo, compressQris, deleteImageSafe } from '@/core/services/imageService';
import { fileExists } from '@/core/services/storageService';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';

export default function LogoSetupScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const [logo, setLogo] = useState<string | null>(null);
  const [pln, setPln] = useState<string | null>(null);
  const [qris, setQris] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [logoPath, plnPath, qrisPath] = await Promise.all([
      getSetting(SETTINGS_KEYS.bumdesLogo),
      getSetting(SETTINGS_KEYS.plnLogo),
      getSetting(SETTINGS_KEYS.qrisImage),
    ]);
    setLogo(fileExists(logoPath) ? logoPath : null);
    setPln(fileExists(plnPath) ? plnPath : null);
    setQris(fileExists(qrisPath) ? qrisPath : null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const previous = {
        logo: await getSetting(SETTINGS_KEYS.bumdesLogo),
        pln: await getSetting(SETTINGS_KEYS.plnLogo),
        qris: await getSetting(SETTINGS_KEYS.qrisImage),
      };
      if (previous.logo && previous.logo !== logo) deleteImageSafe(previous.logo);
      if (previous.pln && previous.pln !== pln) deleteImageSafe(previous.pln);
      if (previous.qris && previous.qris !== qris) deleteImageSafe(previous.qris);
      await Promise.all([
        setSetting(SETTINGS_KEYS.bumdesLogo, logo),
        setSetting(SETTINGS_KEYS.plnLogo, pln),
        setSetting(SETTINGS_KEYS.qrisImage, qris),
      ]);
      hapticSuccess();
      showBanner('Logo diperbarui. Otomatis dipakai di semua fitur.', { type: 'success' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <PageHeader title="Logo Aplikasi" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <Text style={[styles.title, { color: colors.text }]}>Logo Aplikasi — satu logo untuk semuanya</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Dipakai otomatis di dashboard, layar login, struk thermal (A/B/C), invoice F4, dan laporan PDF. Crop 1:1,
            dikompres 512×512 PNG.
          </Text>
          <View style={styles.center}>
            <ImagePickField
              uri={logo}
              size={150}
              circular
              icon="register_upload"
              label="Unggah Logo Toko"
              onPick={async (picked) => setLogo(await compressLogo(picked.uri, picked.width, picked.height))}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.title, { color: colors.text }]}>Logo PLN</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>Dipakai pada struk pembayaran listrik (template B).</Text>
          <View style={styles.center}>
            <ImagePickField
              uri={pln}
              size={120}
              icon="pln_upload"
              label="Unggah Logo PLN"
              onPick={async (picked) => setPln(await compressLogo(picked.uri, picked.width, picked.height))}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.title, { color: colors.text }]}>QRIS Toko</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Ditampilkan di layar pembayaran QRIS. Bila kosong, pembayaran QRIS memakai placeholder.
          </Text>
          <View style={styles.center}>
            <ImagePickField
              uri={qris}
              size={150}
              icon="kasir_scan"
              label="Unggah QRIS"
              onPick={async (picked) => setQris(await compressQris(picked.uri, picked.width, picked.height))}
            />
          </View>
        </Card>

        <PrimaryButton label="Simpan Logo" onPress={() => void save()} loading={saving} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { gap: 8 },
  title: { fontSize: 14, fontWeight: '900' },
  hint: { fontSize: 11, lineHeight: 16 },
  center: { alignItems: 'center', paddingVertical: 8 },
});
