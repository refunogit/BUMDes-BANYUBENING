/** Central banner (F4): 92% width, max 560, top insets+12, slide-down, 4s. */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBannerStore } from '@/store/bannerStore';
import { useTheme } from '@/store/themeStore';
import { sh } from '@/core/utils/scale';

export function BannerHost(): React.ReactElement | null {
  const current = useBannerStore((s) => s.current);
  const hide = useBannerStore((s) => s.hide);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!current) return undefined;
    translateY.value = withTiming(0, { duration: 260 });
    opacity.value = withTiming(1, { duration: 200 });
    const timer = setTimeout(() => {
      translateY.value = withTiming(-120, { duration: 220 });
      opacity.value = withTiming(0, { duration: 200 });
      setTimeout(hide, 220);
    }, current.duration);
    return () => clearTimeout(timer);
  }, [current, hide, opacity, translateY]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!current) return null;
  const tone =
    current.type === 'error'
      ? colors.danger
      : current.type === 'success'
        ? colors.success
        : current.type === 'warning'
          ? colors.gold
          : colors.primary;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.host,
        { top: insets.top + sh(12) },
        animated,
      ]}
    >
      <View style={[styles.banner, { backgroundColor: colors.card, borderLeftColor: tone }]}>
        <Text style={[styles.text, { color: colors.text }]} numberOfLines={3}>
          {current.message}
        </Text>
        {current.action ? (
          <Pressable
            onPress={() => {
              current.action?.onPress();
              hide();
            }}
            accessibilityRole="button"
          >
            <Text style={[styles.action, { color: tone }]}>{current.action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 999 },
  banner: {
    width: '92%',
    maxWidth: 560,
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: { flex: 1, fontSize: 13, lineHeight: 18 },
  action: { fontSize: 13, fontWeight: '800' },
});
