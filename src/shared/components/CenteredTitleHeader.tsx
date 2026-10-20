/** Judul rata-tengah + aksen emas (tanpa back di atas), untuk menu Pengaturan. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/store/themeStore';

export function CenteredTitleHeader({ title, subtitle }: { title: string; subtitle?: string }): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={[styles.accent, { backgroundColor: colors.gold }]} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={styles.accent} />
      </View>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingTop: 14, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  accent: { width: 18, height: 3, borderRadius: 2 },
  title: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 11, textAlign: 'center' },
});
