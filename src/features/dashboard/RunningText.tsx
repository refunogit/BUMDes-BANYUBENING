/**
 * Running text 38: speaker.png, gradient navy, gold border, seamless marquee
 * 3x salinan @28px/s, glow denyut 900ms, separator "•••".
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/AppIcon';
import { ms } from '@/core/utils/scale';

type Props = { messages: string[] };

export function RunningText({ messages }: Props): React.ReactElement {
  const [segmentWidth, setSegmentWidth] = useState(0);
  const translateX = useSharedValue(0);
  const glow = useSharedValue(0.35);

  const text = `${messages.filter(Boolean).join(' • ')} ••• `;

  useEffect(() => {
    glow.value = withRepeat(withTiming(0.95, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(glow);
  }, [glow]);

  useEffect(() => {
    if (!segmentWidth) return undefined;
    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-segmentWidth, { duration: (segmentWidth / 28) * 1000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(translateX);
  }, [segmentWidth, translateX]);

  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <LinearGradient colors={['#0A2A4E', '#0C3B6E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.wrapper}>
      <View style={styles.iconBox}>
        <AppIcon name="speaker" size={22} />
      </View>
      <View style={styles.viewport}>
        <Animated.View style={[styles.track, animated]}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              onLayout={index === 0 ? (event) => setSegmentWidth(event.nativeEvent.layout.width) : undefined}
              style={styles.segment}
            >
              <Text style={styles.text} numberOfLines={1}>
                {text}
              </Text>
            </View>
          ))}
        </Animated.View>
      </View>
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#D8A93E',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 10,
    height: ms(44),
    overflow: 'hidden',
  },
  iconBox: { width: ms(26), height: ms(26), alignItems: 'center', justifyContent: 'center' },
  viewport: { flex: 1, overflow: 'hidden' },
  track: { flexDirection: 'row' },
  segment: { paddingRight: 16 },
  text: { color: '#EAFBFF', fontSize: 13, fontWeight: '700' },
  glow: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#2F86D1', opacity: 0.2 },
});
