import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { PinPad } from '@/shared/components/PinPad';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { AuthLogo } from '@/shared/components/AuthLogo';
import { AppIcon } from '@/shared/components/AppIcon';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/store/themeStore';
import { hapticSuccess } from '@/core/utils/haptics';

export default function LoginScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const needsSetup = useAuthStore((s) => s.needsSetup);
  const loginWithPin = useAuthStore((s) => s.loginWithPin);
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    setError(null);
  }, [needsSetup]);

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {needsSetup ? (
            <View style={styles.setupWrapper}>
              <AuthLogo size={96} />
              <Text style={[styles.brand, { color: colors.text }]}>KASIRKU</Text>
              <View style={[styles.welcomeCard, { backgroundColor: colors.amberSoft, borderColor: colors.gold }]}>
                <Text style={[styles.welcomeTitle, { color: colors.gold }]}>SELAMAT DATANG</Text>
                <Text style={[styles.welcomeText, { color: colors.text }]}>Buat Akun Kasir Pertama Anda</Text>
              </View>
              <PrimaryButton label="Daftar" onPress={() => router.push('/register')} style={styles.registerButton} />
              <Text style={[styles.helper, { color: colors.textMuted }]}>
                Data tersimpan offline di perangkat Anda.
              </Text>
            </View>
          ) : (
            <View style={styles.loginWrapper}>
              <AuthLogo size={110} />
              <Text style={[styles.brand, { color: colors.text }]}>KASIRKU</Text>
              <Text style={[styles.tagline, { color: colors.textMuted }]}>Kasir Digital untuk BUMDes</Text>
              {user?.displayName ? (
                <Text style={[styles.cashier, { color: colors.text }]}>Halo, {user.displayName}</Text>
              ) : null}
              <View style={styles.pinHeader}>
                <AppIcon name="login_gembok" size={20} />
                <Text style={[styles.pinHint, { color: colors.textMuted }]}>Masukkan PIN Anda untuk masuk</Text>
              </View>
              <PinPad
                error={error}
                disabled={checking}
                resetSignal={resetSignal}
                onChanged={() => setError(null)}
                onComplete={async (pin) => {
                  if (checking) return;
                  setChecking(true);
                  const ok = await loginWithPin(pin);
                  setChecking(false);
                  if (ok) {
                    hapticSuccess();
                    router.replace('/(tabs)');
                  } else {
                    setError('PIN salah');
                    setResetSignal((n) => n + 1);
                  }
                }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  setupWrapper: { alignItems: 'center', gap: 16 },
  loginWrapper: { alignItems: 'center', gap: 6 },
  brand: { fontSize: 30, fontWeight: '900', letterSpacing: 2 },
  tagline: { fontSize: 13, marginBottom: 8 },
  cashier: { fontSize: 13, fontWeight: '700' },
  pinHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 8 },
  pinHint: { fontSize: 13 },
  welcomeCard: { width: '100%', borderRadius: 12, borderWidth: 1, padding: 20, alignItems: 'center', gap: 6 },
  welcomeTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
  welcomeText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  registerButton: { width: '100%', marginTop: 6 },
  helper: { fontSize: 11, textAlign: 'center' },
});
