import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from './AppIcon';
import type { AppIconKey } from '@/core/constants/appIcons';
import { useTheme } from '@/store/themeStore';

type Props = { title: string; subtitle?: string; icon?: AppIconKey; action?: React.ReactNode };

export function EmptyState({ title, subtitle, icon, action }: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      {icon ? <AppIcon name={icon} size={64} opacity={0.85} /> : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 28, paddingHorizontal: 16 },
  title: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
