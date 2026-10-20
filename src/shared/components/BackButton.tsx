import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AppIcon } from './AppIcon';
import { useTheme } from '@/store/themeStore';
import { hapticLight } from '@/core/utils/haptics';
import { ms } from '@/core/utils/scale';

type Props = {
  onPress: () => void;
  label?: string;
  align?: 'left' | 'center';
};

/** In-page back pill — marginBottom 8 (referensi Setup Struk). */
export function BackButton({ onPress, label = 'Kembali', align = 'left' }: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: colors.chipBg, opacity: pressed ? 0.75 : 1, alignSelf: align === 'center' ? 'center' : 'flex-start' },
      ]}
    >
      <AppIcon name="panah_kembali" size={16} tintColor={colors.primary} />
      <Text style={[styles.label, { color: colors.primary, fontSize: ms(12) }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  label: { fontWeight: '700' },
});
