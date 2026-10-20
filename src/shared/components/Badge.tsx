import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/store/themeStore';

type Props = { label: string; tone?: 'primary' | 'gold' | 'success' | 'danger' | 'muted' };

export function Badge({ label, tone = 'primary' }: Props): React.ReactElement {
  const { colors } = useTheme();
  const map = {
    primary: colors.primary,
    gold: colors.gold,
    success: colors.success,
    danger: colors.danger,
    muted: colors.textMuted,
  } as const;
  return (
    <View style={[styles.badge, { borderColor: map[tone], backgroundColor: `${map[tone]}1A` }]}>
      <Text style={[styles.text, { color: map[tone] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
});
