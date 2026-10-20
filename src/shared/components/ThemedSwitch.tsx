import React from 'react';
import { Switch, View, Text, StyleSheet } from 'react-native';

import { useTheme } from '@/store/themeStore';

type Props = { value: boolean; onValueChange: (value: boolean) => void; label?: string; hint?: string };

export function ThemedSwitch({ value, onValueChange, label, hint }: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
        {hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  texts: { flex: 1, gap: 2 },
  label: { fontSize: 14, fontWeight: '700' },
  hint: { fontSize: 11 },
});
