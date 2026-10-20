import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BarChart, type BarPoint } from '@/shared/components/BarChart';
import { Card } from '@/shared/components/Card';
import { useTheme } from '@/store/themeStore';
import { formatRupiah } from '@/core/utils/currency';
import type { DailyPoint } from '@/data/repositories/transactionRepository';
import { MONTH_SHORT } from '@/core/utils/date';

type Props = { points: DailyPoint[]; monthTotal: number };

export function TrendChartCard({ points, monthTotal }: Props): React.ReactElement {
  const { colors } = useTheme();
  const data: BarPoint[] = points.map((point) => {
    const date = new Date(`${point.date}T00:00:00`);
    return { label: `${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`, value: point.revenue };
  });
  const weekTotal = points.reduce((sum, point) => sum + point.revenue, 0);

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>TREN 7 HARI</Text>
      {weekTotal <= 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>Belum ada penjualan dalam 7 hari terakhir</Text>
      ) : (
        <BarChart data={data} height={168} />
      )}
      <View style={[styles.summary, { borderTopColor: colors.border }]}>
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>7 Hari</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{formatRupiah(weekTotal)}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Bulan Ini</Text>
          <Text style={[styles.summaryValue, { color: colors.gold }]}>{formatRupiah(monthTotal)}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  title: { fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },
  empty: { fontSize: 12, paddingVertical: 26, textAlign: 'center' },
  summary: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10 },
  summaryCell: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1 },
  summaryLabel: { fontSize: 10, fontWeight: '700' },
  summaryValue: { fontSize: 14, fontWeight: '900' },
});
