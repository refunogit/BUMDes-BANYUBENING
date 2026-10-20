import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { AppIcon } from '@/shared/components/AppIcon';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { useTheme } from '@/store/themeStore';

export default function NotFoundScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Screen edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: 'Halaman tidak ditemukan' }} />
      <View style={styles.content}>
        <AppIcon name="dash_stok_alert" size={80} />
        <Text style={[styles.title, { color: colors.text }]}>Halaman tidak ditemukan</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Tautan yang Anda buka tidak tersedia di aplikasi ini.
        </Text>
        <PrimaryButton label="Ke Beranda" onPress={() => router.replace('/(tabs)')} style={styles.button} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  button: { marginTop: 8, minWidth: 180 },
});
