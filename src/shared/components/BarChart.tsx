import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/store/themeStore';
import { formatCompactRupiah } from '@/core/utils/currency';

export type BarPoint = { label: string; value: number };

type Props = { data: BarPoint[]; height?: number };

/** Bar chart sederhana: 6 batang biru, batang terakhir emas. */
export function BarChart({ data, height = 170 }: Props): React.ReactElement {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const max = Math.max(1, ...data.map((point) => point.value));
  const chartHeight = height - 34;
  const slot = data.length ? width / data.length : 0;
  const barWidth = Math.max(8, Math.min(34, slot * 0.52));

  return (
    <View style={{ height }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {data.map((point, index) => {
            const barHeight = Math.max(2, (point.value / max) * (chartHeight - 18));
            const x = slot * index + (slot - barWidth) / 2;
            const y = chartHeight - barHeight;
            const isLast = index === data.length - 1;
            return (
              <React.Fragment key={`${point.label}-${index}`}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={5}
                  fill={isLast ? colors.gold : colors.primary}
                  opacity={point.value > 0 ? 1 : 0.25}
                />
                {point.value > 0 && index === data.length - 1 ? (
                  <SvgText x={x + barWidth / 2} y={Math.max(10, y - 4)} fontSize={9} fill={colors.textMuted} textAnchor="middle">
                    {formatCompactRupiah(point.value)}
                  </SvgText>
                ) : null}
                <SvgText x={slot * index + slot / 2} y={height - 8} fontSize={9} fill={colors.textMuted} textAnchor="middle">
                  {point.label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      ) : (
        <Text style={[styles.placeholder, { color: colors.textMuted }]}>Memuat grafik...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { textAlign: 'center', marginTop: 60, fontSize: 12 },
});
