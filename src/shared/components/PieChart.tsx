import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { useTheme } from '@/store/themeStore';
import { formatRupiah } from '@/core/utils/currency';
import { ms } from '@/core/utils/scale';

export type PieSlice = { label: string; value: number };

const COLORS = ['#2F86D1', '#0C3B6E', '#D8A93E', '#D64545', '#2E7D32', '#6C63FF', '#00A6A6', '#8A8A8A'];

function arc(cx: number, cy: number, r: number, start: number, end: number): string {
  const startRad = ((start - 90) * Math.PI) / 180;
  const endRad = ((end - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function PieChart({ data }: { data: PieSlice[] }): React.ReactElement {
  const { colors } = useTheme();
  const [size, setSize] = useState(0);
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const radius = size / 2;
  let angle = 0;

  return (
    <View style={styles.wrapper}>
      <View style={{ width: ms(140), height: ms(140) }} onLayout={(event) => setSize(event.nativeEvent.layout.width)}>
        {size > 0 && total > 0 ? (
          <Svg width={size} height={size}>
            <G>
              {data.map((slice, index) => {
                const sweep = (slice.value / total) * 360;
                const path = arc(radius, radius, radius - 2, angle, angle + Math.max(0.5, sweep));
                angle += sweep;
                return <Path key={slice.label} d={path} fill={COLORS[index % COLORS.length]} />;
              })}
            </G>
          </Svg>
        ) : null}
      </View>
      <View style={styles.legend}>
        {data.map((slice, index) => (
          <View key={slice.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: COLORS[index % COLORS.length] }]} />
            <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
              {slice.label}
            </Text>
            <Text style={[styles.legendValue, { color: colors.textMuted }]}>{formatRupiah(slice.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  legend: { flex: 1, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 11, fontWeight: '600' },
  legendValue: { fontSize: 10 },
});
