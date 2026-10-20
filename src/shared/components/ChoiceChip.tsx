import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/store/themeStore';

type Props = { label: string; active: boolean; onPress: () => void };

/** Pill chip: aktif = pill gradasi biru (diproksikan warna solid), nonaktif border. */
export function ChoiceChip({ label, active, onPress }: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        active
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: 'transparent', borderColor: colors.border },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.label, { color: active ? '#FFFFFF' : colors.text, fontWeight: active ? '800' : '600' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, marginBottom: 8 },
  label: { fontSize: 12 },
});
