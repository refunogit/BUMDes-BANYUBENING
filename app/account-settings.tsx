import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { CenteredTitleHeader } from '@/shared/components/CenteredTitleHeader';
import { Card } from '@/shared/components/Card';
import { CustomTextField } from '@/shared/components/CustomTextField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { SecondaryButton } from '@/shared/components/SecondaryButton';
import { ChangePinModal } from '@/features/auth/ChangePinModal';
import { useTheme } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { isPin } from '@/core/utils/validators';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';

export default function AccountSettingsScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const changeUsername = useAuthStore((s) => s.changeUsername);

  const [username, setUsername] = useState(user?.username ?? '');
  const [usernamePin, setUsernamePin] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [pinModal, setPinModal] = useState(false);

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <CenteredTitleHeader title="Pengaturan Akun" subtitle="Kelola username dan PIN keamanan" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ubah Username</Text>
          <CustomTextField label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" hint="Minimal 3 karakter (huruf kecil, angka, underscore)." />
          <CustomTextField
            label="PIN Saat Ini"
            value={usernamePin}
            onChangeText={setUsernamePin}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            placeholder="6 digit"
          />
          <PrimaryButton
            label="Simpan Username"
            loading={savingUsername}
            onPress={async () => {
              if (!isPin(usernamePin)) {
                showBanner('Masukkan PIN 6 digit.', { type: 'error' });
                return;
              }
              setSavingUsername(true);
              try {
                const result = await changeUsername(usernamePin, username);
                if (result.ok) {
                  hapticSuccess();
                  showBanner('Username diperbarui.', { type: 'success' });
                  setUsernamePin('');
                } else {
                  showBanner(result.error ?? 'Gagal mengubah username.', { type: 'error' });
                }
              } finally {
                setSavingUsername(false);
              }
            }}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ubah PIN</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Verifikasi PIN lama, lalu masukkan PIN baru dua kali. PIN hanya numerik 6 digit.
          </Text>
          <PrimaryButton label="Ubah PIN" icon="set_ubah_pin" onPress={() => setPinModal(true)} />
        </Card>

        <SecondaryButton label="Kembali" onPress={() => router.back()} />
      </ScrollView>

      <ChangePinModal visible={pinModal} onClose={() => setPinModal(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '900' },
  hint: { fontSize: 11, lineHeight: 16 },
});
