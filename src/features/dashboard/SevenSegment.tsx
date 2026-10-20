/**
 * SevenSegmentDigit — segmen 7 via Views absolut (BUKAN font eksternal).
 * Aktif #EAFBFF dengan glow cyan; ghost opacity 0.12.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ms } from '@/core/utils/scale';

const SEGMENTS: Record<string, string[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'c', 'd'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
};

const ACTIVE = '#EAFBFF';
const GHOST = '#EAFBFF';

type Props = { digit: string; height?: number };

export function SevenSegmentDigit({ digit, height = 46 }: Props): React.ReactElement {
  const unit = height / 46;
  const w = 26 * unit;
  const h = 46 * unit;
  const t = Math.max(2, 4 * unit);
  const vh = 16 * unit;
  const active = SEGMENTS[digit] ?? [];

  const seg = (name: string, style: object): React.ReactElement => {
    const on = active.includes(name);
    return (
      <View
        style={[
          style,
          {
            backgroundColor: on ? ACTIVE : GHOST,
            opacity: on ? 1 : 0.12,
            shadowColor: '#7DE3FF',
            shadowOpacity: on ? 0.9 : 0,
            shadowRadius: on ? 6 : 0,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      />
    );
  };

  return (
    <View style={{ width: w, height: h }}>
      {seg('a', { position: 'absolute', left: t, top: 0, width: w - 2 * t, height: t, borderRadius: t / 2 })}
      {seg('f', { position: 'absolute', left: 0, top: t, width: t, height: vh, borderRadius: t / 2 })}
      {seg('b', { position: 'absolute', right: 0, top: t, width: t, height: vh, borderRadius: t / 2 })}
      {seg('g', { position: 'absolute', left: t, top: h / 2 - t / 2, width: w - 2 * t, height: t, borderRadius: t / 2 })}
      {seg('e', { position: 'absolute', left: 0, bottom: t, width: t, height: vh, borderRadius: t / 2 })}
      {seg('c', { position: 'absolute', right: 0, bottom: t, width: t, height: vh, borderRadius: t / 2 })}
      {seg('d', { position: 'absolute', left: t, bottom: 0, width: w - 2 * t, height: t, borderRadius: t / 2 })}
    </View>
  );
}

export function SevenSegmentNumber({ value, digits = 2, height = 46 }: { value: number; digits?: number; height?: number }): React.ReactElement {
  const text = String(Math.max(0, Math.floor(value))).padStart(digits, '0').slice(-digits);
  return (
    <View style={styles.row}>
      {text.split('').map((digit, index) => (
        <SevenSegmentDigit key={`${index}-${digit}`} digit={digit} height={height} />
      ))}
    </View>
  );
}

export function SevenSegmentColon({ height = 46 }: { height?: number }): React.ReactElement {
  const dot = Math.max(3, height * 0.09);
  return (
    <View style={[styles.colon, { height: ms(height), width: dot * 2 }]}>
      <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: '#F08A1D' }} />
      <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: '#F08A1D' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  colon: { justifyContent: 'space-evenly', alignItems: 'center', marginHorizontal: 2 },
});
