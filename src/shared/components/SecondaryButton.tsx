import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon } from './AppIcon';
import type { AppIconKey } from '@/core/constants/appIcons';
import { useTheme } from '@/store/themeStore';
import { hapticLight } from '@/core/utils/haptics';
import { ms } from '@/core/utils/scale';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: AppIconKey;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export function SecondaryButton({
  label,
  onPress,
  disabled,
  loading,
  icon,
  color,
  height = 48,
  style,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  const tint = color ?? colors.primary;
  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        hapticLight();
        onPress();
      }}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        { borderColor: tint, opacity: disabled ? 0.45 : pressed ? 0.8 : 1, minHeight: ms(height) },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tint} />
      ) : (
        <View style={styles.content}>
          {icon ? <AppIcon name={icon} size={20} tintColor={tint} /> : null}
          <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, fontWeight: '700' },
});
