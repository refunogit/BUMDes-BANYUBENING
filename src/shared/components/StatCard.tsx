import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppIconKey } from '@/core/constants/appIcons';
import { AppIcon } from './AppIcon';
import { useTheme } from '@/store/themeStore';

type Props = { label: string; value: string; icon?: AppIconKey; tint?: string };

export function StatCard({ label, value, icon, tint }: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${tint ?? colors.primary}18` }]}>
          <AppIcon name={icon} size={20} />
        </View>
      ) : null}
      <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.value, { color: tint ?? colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, gap: 6, minWidth: 0 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600' },
  value: { fontSize: 17, fontWeight: '800' },
});
