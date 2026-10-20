import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppIconKey } from '@/core/constants/appIcons';
import { AppIcon } from './AppIcon';
import { useTheme } from '@/store/themeStore';

type Props = { title: string; icon?: AppIconKey; right?: React.ReactNode };

export function SectionHeader({ title, icon, right }: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {icon ? <AppIcon name={icon} size={22} /> : null}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  title: { fontSize: 16, fontWeight: '800', flexShrink: 1 },
});
