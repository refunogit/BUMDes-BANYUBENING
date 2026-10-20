import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/store/themeStore';
import { hapticLight } from '@/core/utils/haptics';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  height?: number;
};

export function SegmentedControl<T extends string>({ options, value, onChange, height = 44 }: Props<T>): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrapper, { backgroundColor: colors.surface, borderColor: colors.border, height }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              hapticLight();
              onChange(option.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && { backgroundColor: colors.primary }]}
          >
            <Text
              style={[styles.label, { color: active ? '#FFFFFF' : colors.textMuted, fontWeight: active ? '800' : '600' }]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 3, gap: 3 },
  segment: { flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  label: { fontSize: 13 },
});
