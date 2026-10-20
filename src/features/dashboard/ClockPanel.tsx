/**
 * Panel jam digital: kontainer navy, bracket oranye, sel label Jam/Menit/Detik,
 * nama hari Indonesia, lalu baris Hari/Bulan/Tahun. Update 1 detik (memo).
 */
import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SevenSegmentColon, SevenSegmentNumber } from './SevenSegment';
import { dayName, monthName } from '@/core/utils/date';

function Cell({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  );
}

function ClockPanelBase(): React.ReactElement {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const day = dayName(now);
  const date = now.getDate();
  const month = monthName(now);
  const year = now.getFullYear();
  const hh = now.getHours();
  const mm = now.getMinutes();
  const ss = now.getSeconds();

  return (
    <View style={styles.panel}>
      <View style={[styles.bracket, styles.bracketTL]} />
      <View style={[styles.bracket, styles.bracketTR]} />
      <View style={[styles.bracket, styles.bracketBL]} />
      <View style={[styles.bracket, styles.bracketBR]} />

      <View style={styles.labelsRow}>
        <Text style={styles.headerCell}>Jam</Text>
        <Text style={styles.headerCell}>Menit</Text>
        <Text style={styles.headerCell}>Detik</Text>
      </View>

      <View style={styles.digitsRow}>
        <SevenSegmentNumber value={hh} height={46} />
        <SevenSegmentColon height={46} />
        <SevenSegmentNumber value={mm} height={46} />
        <SevenSegmentColon height={46} />
        <SevenSegmentNumber value={ss} height={46} />
      </View>

      <Text style={styles.dayName}>{day}</Text>

      <View style={styles.dateRow}>
        <Cell label="Hari" value={String(date).padStart(2, '0')} />
        <Cell label="Bulan" value={month} />
        <Cell label="Tahun" value={String(year)} />
      </View>
    </View>
  );
}

export const ClockPanel = memo(ClockPanelBase);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#0A1F33',
    borderColor: '#1F6E8C',
    borderWidth: 3,
    borderRadius: 24,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  bracket: { position: 'absolute', width: 18, height: 18, borderColor: '#F08A1D' },
  bracketTL: { top: 6, left: 6, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 6 },
  bracketTR: { top: 6, right: 6, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 6 },
  bracketBL: { bottom: 6, left: 6, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 6 },
  bracketBR: { bottom: 6, right: 6, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 6 },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  headerCell: {
    flex: 1,
    backgroundColor: '#14506B',
    color: '#EAFBFF',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 4,
    borderRadius: 6,
    letterSpacing: 1,
  },
  digitsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 2 },
  dayName: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 },
  dateRow: { flexDirection: 'row', gap: 8 },
  cell: { flex: 1, backgroundColor: '#0F3A52', borderRadius: 8, paddingVertical: 6, alignItems: 'center', gap: 2 },
  cellLabel: { color: '#8FD3E8', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  cellValue: { color: '#EAFBFF', fontSize: 14, fontWeight: '800' },
});
