/** Header v2: BackButton pill + judul rata-tengah + aksen emas. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BackButton } from './BackButton';
import { useTheme } from '@/store/themeStore';

type Props = { title: string; onBack: () => void; right?: React.ReactNode; backLabel?: string };

export function PageHeader({ title, onBack, right, backLabel }: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <BackButton onPress={onBack} label={backLabel} />
        {right ?? null}
      </View>
      <View style={styles.titleRow}>
        <View style={[styles.accent, { backgroundColor: colors.gold }]} />
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingTop: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  accent: { width: 18, height: 3, borderRadius: 2 },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center', maxWidth: '80%' },
  spacer: { width: 18 },
});
