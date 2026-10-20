/**
 * PinPad — 6 dots, gold glow, elastic fill (1.45, 350ms), buttons 74x74 with
 * two neon shadow layers, press scale 0.90/120ms, light haptic per tap.
 * Numeric PIN only — no biometrics.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/store/themeStore';
import type { ThemeColors } from '@/core/constants/theme';
import { hapticLight, hapticError } from '@/core/utils/haptics';
import { ms } from '@/core/utils/scale';

export const PIN_LENGTH = 6;

type DotProps = { filled: boolean; color: string };

function Dot({ filled, color }: DotProps): React.ReactElement {
  const scale = useSharedValue(filled ? 1 : 0.7);
  useEffect(() => {
    if (filled) {
      scale.value = withSequence(withSpring(1.45, { damping: 8, stiffness: 180 }), withSpring(1, { damping: 12 }));
    } else {
      scale.value = withTiming(0.7, { duration: 180 });
    }
  }, [filled, scale]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.dotSlot}>
      {filled ? <View style={[styles.dotGlow, { backgroundColor: color }]} /> : null}
      <Animated.View
        style={[
          styles.dot,
          { borderColor: filled ? color : 'rgba(255,255,255,0.45)', backgroundColor: filled ? color : 'transparent' },
          animated,
        ]}
      />
    </View>
  );
}

type KeyProps = {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  colors: ThemeColors;
};

function Key({ label, onPress, secondary, colors }: KeyProps): React.ReactElement {
  const scale = useSharedValue(1);
  const inner = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withTiming(0.9, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      }}
      onPress={() => {
        hapticLight();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label === '⌫' ? 'Hapus' : label}
      style={{ width: ms(74), height: ms(74) }}
    >
      <Animated.View
        style={[
          styles.key,
          {
            backgroundColor: secondary ? 'rgba(255,255,255,0.06)' : colors.card,
            borderColor: secondary ? 'rgba(255,255,255,0.12)' : colors.border,
          },
          inner,
        ]}
      >
        <View
          style={[
            styles.neonLayer,
            {
              backgroundColor: colors.primary,
              opacity: secondary ? 0.05 : 0.16,
              shadowColor: colors.primary,
            },
          ]}
        />
        <View
          style={[
            styles.neonLayer2,
            { backgroundColor: colors.gold, opacity: secondary ? 0.03 : 0.08, shadowColor: colors.gold },
          ]}
        />
        <Text style={[styles.keyLabel, { color: secondary ? colors.gold : colors.navy }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

type Props = {
  onComplete: (pin: string) => void;
  onChanged?: (pin: string) => void;
  error?: string | null;
  disabled?: boolean;
  resetSignal?: number;
  title?: string;
  subtitle?: string;
};

export function PinPad({
  onComplete,
  onChanged,
  error,
  disabled,
  resetSignal = 0,
  title,
  subtitle,
}: Props): React.ReactElement {
  const { colors, isDark } = useTheme();
  const [pin, setPin] = useState('');
  const shake = useSharedValue(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPin('');
    onChanged?.('');
  }, [onChanged]);

  useEffect(() => {
    reset();
  }, [resetSignal, reset]);

  useEffect(() => {
    if (error) {
      shake.value = withSequence(
        withTiming(-12, { duration: 60 }),
        withTiming(12, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
      setLocalError(error);
      hapticError();
      const timer = setTimeout(() => {
        reset();
        setLocalError(null);
      }, 350);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error, reset, shake]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const handleDigit = (digit: string) => {
    if (disabled || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    setLocalError(null);
    onChanged?.(next);
    if (next.length === PIN_LENGTH) {
      onComplete(next);
    }
  };

  const handleDelete = () => {
    if (disabled) return;
    setPin((current) => current.slice(0, -1));
    onChanged?.(pin.slice(0, -1));
  };

  const rows: (string | null)[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [null, '0', '⌫'],
  ];

  return (
    <View style={styles.container}>
      {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      <Animated.View style={[styles.dots, shakeStyle]}>
        {Array.from({ length: PIN_LENGTH }).map((_, index) => (
          <Dot key={index} filled={index < pin.length} color={colors.gold} />
        ))}
      </Animated.View>
      {localError ? <Text style={[styles.error, { color: colors.danger }]}>{localError}</Text> : null}
      <View style={styles.pad}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((key, keyIndex) =>
              key === null ? (
                <View key={`empty-${keyIndex}`} style={{ width: ms(74), height: ms(74) }} />
              ) : (
                <Key
                  key={key}
                  label={key}
                  secondary={key === '⌫'}
                  colors={colors}
                  onPress={() => (key === '⌫' ? handleDelete() : handleDigit(key))}
                />
              ),
            )}
          </View>
        ))}
      </View>
      <Text style={[styles.hint, { color: isDark ? colors.textMuted : colors.textMuted }]}>
        PIN numerik 6 digit
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 14 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 13, textAlign: 'center', paddingHorizontal: 12 },
  dots: { flexDirection: 'row', gap: 14, marginVertical: 6 },
  dotSlot: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  dotGlow: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    opacity: 0.35,
  },
  error: { fontSize: 13, fontWeight: '700' },
  pad: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  key: {
    flex: 1,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  neonLayer: { position: 'absolute', top: 2, left: 6, right: 6, height: 18, borderRadius: 10, shadowOpacity: 0.7, shadowRadius: 12 },
  neonLayer2: { position: 'absolute', bottom: 4, left: 12, right: 12, height: 10, borderRadius: 8, shadowOpacity: 0.6, shadowRadius: 10 },
  keyLabel: { fontSize: 26, fontWeight: '700' },
  hint: { fontSize: 11 },
});
