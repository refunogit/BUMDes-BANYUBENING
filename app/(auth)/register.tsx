import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { BackButton } from '@/shared/components/BackButton';
import { CustomTextField } from '@/shared/components/CustomTextField';
import { ImagePickField } from '@/shared/components/ImagePickField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { useTheme } from '@/store/themeStore';
import { useRegisterStore } from '@/store/registerStore';
import { compressLogo } from '@/core/services/imageService';
import { autoUsername } from '@/core/utils/validators';
import { showBanner } from '@/store/bannerStore';

export default function RegisterScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const draft = useRegisterStore();
  const [adminName, setAdminName] = useState(draft.adminName);
  const [storeName, setStoreName] = useState(draft.storeName);
  const [logo, setLogo] = useState<string | null>(draft.logoPath);
  const [errors, setErrors] = useState<{ admin?: string; store?: string }>({});

  const username = useMemo(() => autoUsername(storeName || adminName), [storeName, adminName]);

  const submit = () => {
    const nextErrors: { admin?: string; store?: string } = {};
    if (!adminName.trim()) nextErrors.admin = 'Nama lengkap admin wajib diisi.';
    if (!storeName.trim()) nextErrors.store = 'Nama BUMDes/Toko wajib diisi.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    draft.setDraft({ adminName: adminName.trim(), storeName: storeName.trim(), username, logoPath: logo });
    router.push('/register-pin');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => router.replace('/login')} />
          <Text style={[styles.step, { color: colors.gold }]}>Langkah 1 dari 2 — Data Toko & Admin</Text>
          <Text style={[styles.title, { color: colors.text }]}>Siapkan Toko Anda</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Logo dan nama ini akan muncul di dashboard, struk, invoice, dan laporan.
          </Text>

          <View style={styles.logoWrapper}>
            <ImagePickField
              uri={logo}
              size={150}
              circular
              icon="register_upload"
              label="Unggah Logo Toko"
              onPick={async (picked) => {
                try {
                  const compressed = await compressLogo(picked.uri, picked.width, picked.height);
                  setLogo(compressed);
                } catch {
                  showBanner('Gagal memproses logo. Coba gambar lain.', { type: 'error' });
                }
              }}
            />
          </View>

          <View style={styles.form}>
            <CustomTextField
              label="Nama Lengkap Admin"
              required
              value={adminName}
              onChangeText={setAdminName}
              placeholder="Contoh: Budi Santoso"
              error={errors.admin}
              autoCapitalize="words"
            />
            <CustomTextField
              label="Nama BUMDes/Toko"
              required
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Contoh: BUMDes Banyubening"
              error={errors.store}
              autoCapitalize="words"
            />
            <View style={[styles.usernameBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.usernameLabel, { color: colors.textMuted }]}>Username otomatis</Text>
              <Text style={[styles.usernameValue, { color: colors.text }]}>{username || '-'}</Text>
            </View>
          </View>

          <PrimaryButton label="Lanjut ke PIN" onPress={submit} style={styles.submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, gap: 10, paddingBottom: 32 },
  step: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginTop: 4 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 6 },
  logoWrapper: { alignItems: 'center', paddingVertical: 8 },
  form: { gap: 14, marginTop: 4 },
  usernameBox: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 2 },
  usernameLabel: { fontSize: 11 },
  usernameValue: { fontSize: 15, fontWeight: '800' },
  submit: { marginTop: 10 },
});
