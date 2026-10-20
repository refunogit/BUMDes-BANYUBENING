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
  textColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  icon,
  color,
  textColor,
  height = 52,
  style,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  const bg = color ?? colors.primary;
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
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.88 : 1, minHeight: ms(height) },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor ?? '#FFFFFF'} />
      ) : (
        <View style={styles.content}>
          {icon ? <AppIcon name={icon} size={22} tintColor={textColor ?? '#FFFFFF'} /> : null}
          <Text style={[styles.label, { color: textColor ?? '#FFFFFF' }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 15, fontWeight: '700' },
});
