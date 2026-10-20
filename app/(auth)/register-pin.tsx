import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { BackButton } from '@/shared/components/BackButton';
import { PinPad } from '@/shared/components/PinPad';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { LoadingOverlay } from '@/shared/components/LoadingOverlay';
import { useTheme } from '@/store/themeStore';
import { useRegisterStore } from '@/store/registerStore';
import { useAuthStore } from '@/store/authStore';
import { setManySettings } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';

export default function RegisterPinScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const draft = useRegisterStore();
  const register = useAuthStore((s) => s.register);
  const [stage, setStage] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!draft.storeName || !draft.adminName) router.replace('/register');
  }, [draft.storeName, draft.adminName, router]);

  const finish = async () => {
    if (!firstPin || !draft.storeName) return;
    setSaving(true);
    try {
      const ok = await register({
        username: draft.username,
        pin: firstPin,
        displayName: draft.adminName,
      });
      if (!ok) {
        showBanner('Gagal membuat akun. Coba lagi.', { type: 'error' });
        return;
      }
      const entries: Record<string, string> = {
        [SETTINGS_KEYS.bumdesNama]: draft.storeName,
        [SETTINGS_KEYS.userNamaLengkap]: draft.adminName,
        [SETTINGS_KEYS.strukNama]: draft.storeName,
      };
      if (draft.logoPath) entries[SETTINGS_KEYS.bumdesLogo] = draft.logoPath;
      await setManySettings(entries);
      hapticSuccess();
      draft.reset();
      router.replace('/login');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => router.replace('/register')} />
        <Text style={[styles.step, { color: colors.gold }]}>Langkah 2 dari 2 — Keamanan Akun</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {stage === 'create' ? 'Buat PIN Keamanan' : 'Konfirmasi PIN'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {stage === 'create'
            ? 'PIN numerik 6 digit dipakai untuk masuk dan membuka aplikasi.'
            : 'Masukkan kembali PIN yang sama untuk memastikan tidak ada salah ketik.'}
        </Text>

        <View style={styles.pinArea}>
          <PinPad
            key={stage}
            error={error}
            resetSignal={resetSignal}
            onChanged={() => setError(null)}
            onComplete={(pin) => {
              if (stage === 'create') {
                setFirstPin(pin);
                setStage('confirm');
                setError(null);
              } else if (pin !== firstPin) {
                setError('PIN tidak cocok. Silakan coba lagi.');
                setStage('create');
                setFirstPin(null);
                setResetSignal((n) => n + 1);
              }
            }}
          />
        </View>

        {stage === 'confirm' && firstPin ? (
          <PrimaryButton label="Selesai Daftar" onPress={finish} style={styles.submit} loading={saving} />
        ) : (
          <Text style={[styles.helper, { color: colors.textMuted }]}>
            Masukkan 6 digit PIN untuk melanjutkan ke konfirmasi.
          </Text>
        )}
      </ScrollView>
      <LoadingOverlay visible={saving} label="Membuat akun..." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 10, paddingBottom: 32 },
  step: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginTop: 4 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, lineHeight: 19 },
  pinArea: { marginTop: 14, alignItems: 'center' },
  submit: { marginTop: 8 },
  helper: { fontSize: 12, textAlign: 'center' },
});
