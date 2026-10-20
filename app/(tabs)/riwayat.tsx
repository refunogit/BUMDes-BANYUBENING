import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/shared/components/Screen';
import { AppIcon } from '@/shared/components/AppIcon';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { StatCard } from '@/shared/components/StatCard';
import { SegmentedControl } from '@/shared/components/SegmentedControl';
import { BarChart, type BarPoint } from '@/shared/components/BarChart';
import { PieChart } from '@/shared/components/PieChart';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingOverlay } from '@/shared/components/LoadingOverlay';
import { useTheme } from '@/store/themeStore';
import {
  exportReportCsv,
  exportReportPdf,
  loadReport,
  type ReportBundle,
  type ReportKind,
} from '@/features/reports/reportService';
import { formatDateTime, formatDate } from '@/core/utils/date';
import { formatRupiah, formatQuantity } from '@/core/utils/currency';
import { showBanner } from '@/store/bannerStore';
import { getJsonSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';

type InvoiceRecord = { reference: string };

export default function RiwayatScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<ReportKind>('harian');
  const [bundle, setBundle] = useState<ReportBundle | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [invoiceCount, setInvoiceCount] = useState(0);

  const load = useCallback(async () => {
    const [report, invoices] = await Promise.all([
      loadReport(kind),
      getJsonSetting<InvoiceRecord[]>(SETTINGS_KEYS.invoices, []),
    ]);
    setBundle(report);
    setInvoiceCount(invoices.length);
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const runExport = async (mode: 'pdf' | 'csv') => {
    if (!bundle) return;
    setBusy(true);
    try {
      if (mode === 'pdf') await exportReportPdf(bundle);
      else await exportReportCsv(bundle);
    } catch {
      showBanner('Gagal membuat ekspor laporan.', { type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const chartData: BarPoint[] = bundle ? bundle.series.map((point, index) => ({ label: bundle.seriesLabels[index] ?? '', value: point.revenue })) : [];
  const chartTitle = kind === 'harian' ? 'TREN 7 HARI' : kind === 'mingguan' ? 'TREN 8 MINGGU' : 'TREN 12 BULAN';

  return (
    <Screen edges={['top']} padded={false}>
      <View style={styles.header}>
        <View style={styles.headerTexts}>
          <Text style={[styles.title, { color: colors.text }]}>Laporan</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Analisis penjualan toko</Text>
        </View>
        <Pressable
          onPress={() => router.push('/hutang')}
          accessibilityRole="button"
          accessibilityLabel="Riwayat hutang"
          style={[styles.headerIcon, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <AppIcon name="hutang_list" size={22} />
        </Pressable>
      </View>

      <View style={styles.exportRow}>
        <Pressable
          onPress={() => void runExport('pdf')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.exportButton, { borderColor: '#D64545', opacity: pressed ? 0.75 : 1 }]}
        >
          <AppIcon name="laporan_pdf" size={20} />
          <Text style={[styles.exportText, { color: '#D64545' }]}>Ekspor PDF</Text>
        </Pressable>
        <Pressable
          onPress={() => void runExport('csv')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.exportButton, { borderColor: '#2E7D32', opacity: pressed ? 0.75 : 1 }]}
        >
          <AppIcon name="laporan_csv" size={20} />
          <Text style={[styles.exportText, { color: '#2E7D32' }]}>Unduh CSV</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <SegmentedControl
          value={kind}
          onChange={setKind}
          options={[
            { value: 'harian', label: 'Harian' },
            { value: 'mingguan', label: 'Mingguan' },
            { value: 'bulanan', label: 'Bulanan' },
          ]}
        />

        {bundle ? (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard label={`Omzet ${bundle.label}`} value={formatRupiah(bundle.stats.revenue)} icon="nav_riwayat" />
                <StatCard
                  label={`Laba ${bundle.label}`}
                  value={formatRupiah(Math.max(0, bundle.income.netProfit))}
                  icon="panah_naik"
                  tint={colors.success}
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard label="Transaksi" value={String(bundle.stats.transactions)} icon="kasir_bayar" tint={colors.gold} />
                <StatCard label="Item Terjual" value={formatQuantity(bundle.stats.itemsSold)} icon="kasir_keranjang" />
              </View>
            </View>

            <Card style={styles.chartCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{chartTitle}</Text>
              <BarChart data={chartData} height={168} />
            </Card>

            <Card style={styles.chartCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>KATEGORI PENJUALAN</Text>
              {bundle.categories.length === 0 || bundle.categories.every((slice) => slice.value <= 0) ? (
                <Text style={[styles.empty, { color: colors.textMuted }]}>Pie chart akan muncul setelah ada transaksi</Text>
              ) : (
                <PieChart data={bundle.categories} />
              )}
            </Card>

            <Card style={styles.listCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>BARANG TERLARIS</Text>
              {bundle.topProducts.length === 0 ? (
                <Text style={[styles.empty, { color: colors.textMuted }]}>Belum ada data penjualan.</Text>
              ) : (
                bundle.topProducts.map((item, index) => (
                  <View key={item.name} style={[styles.rankRow, { borderTopColor: colors.border }]}>
                    <View style={[styles.medal, { backgroundColor: index === 0 ? colors.gold : colors.surface }]}>
                      <Text style={{ color: index === 0 ? '#0C3B6E' : colors.textMuted, fontWeight: '900', fontSize: 11 }}>{index + 1}</Text>
                    </View>
                    <View style={styles.rankInfo}>
                      <Text style={[styles.rankName, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.rankMeta, { color: colors.textMuted }]}>{formatQuantity(item.qty)} terjual</Text>
                    </View>
                    <Text style={[styles.rankRevenue, { color: colors.primary }]}>{formatRupiah(item.revenue)}</Text>
                  </View>
                ))
              )}
            </Card>

            <Card style={styles.listCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>PIUTANG JATUH TEMPO</Text>
              {bundle.receivables.length === 0 ? (
                <Text style={[styles.empty, { color: colors.textMuted }]}>Tidak ada piutang jatuh tempo.</Text>
              ) : (
                bundle.receivables.map((row) => (
                  <View key={row.id} style={[styles.rankRow, { borderTopColor: colors.border }]}>
                    <View style={styles.rankInfo}>
                      <Text style={[styles.rankName, { color: colors.text }]}>{row.customer_name ?? 'Umum'}</Text>
                      <Text style={[styles.rankMeta, { color: colors.textMuted }]}>Jatuh tempo {formatDate(row.due_date)}</Text>
                    </View>
                    <Text style={[styles.rankRevenue, { color: colors.danger }]}>{formatRupiah(row.remaining_amount)}</Text>
                  </View>
                ))
              )}
            </Card>

            <Pressable
              onPress={() => router.push('/invoice-list')}
              style={[styles.invoiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <AppIcon name="invoice_buat" size={26} />
              <View style={styles.invoiceInfo}>
                <Text style={[styles.invoiceTitle, { color: colors.text }]}>Invoice</Text>
                <Text style={[styles.invoiceHint, { color: colors.textMuted }]}>{invoiceCount} invoice tersimpan</Text>
              </View>
              <Text style={[styles.invoiceAction, { color: colors.primary }]}>Lihat</Text>
            </Pressable>

            <View style={styles.historyHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>RIWAYAT TRANSAKSI</Text>
              <Text style={[styles.historyCount, { color: colors.textMuted }]}>{bundle.transactions.length} transaksi</Text>
            </View>
            {bundle.transactions.length === 0 ? (
              <EmptyState icon="nav_riwayat" title="Belum ada transaksi" subtitle="Transaksi selesai akan muncul di sini." />
            ) : (
              bundle.transactions.map((trx) => (
                <Pressable
                  key={trx.id}
                  onPress={() => router.push({ pathname: '/trx-detail', params: { id: trx.id } })}
                  style={[styles.trxCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.trxTop}>
                    <Text style={[styles.trxNumber, { color: colors.text }]}>#{trx.invoice_number.replace('TRX-', '')}</Text>
                    <Badge
                      label={trx.payment_method === 'qris' ? 'QRIS' : trx.payment_method === 'credit' ? 'PIUTANG' : 'TUNAI'}
                      tone={trx.payment_method === 'qris' ? 'gold' : trx.payment_method === 'credit' ? 'danger' : 'primary'}
                    />
                  </View>
                  <View style={styles.trxBottom}>
                    <Text style={[styles.trxDate, { color: colors.textMuted }]}>{formatDateTime(trx.created_at)}</Text>
                    <View style={styles.trxAmount}>
                      <Text style={[styles.trxTotal, { color: colors.primary }]}>{formatRupiah(trx.total)}</Text>
                      <AppIcon name="panah_naik" size={12} />
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </>
        ) : (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Memuat laporan...</Text>
        )}
      </ScrollView>
      <LoadingOverlay visible={busy} label="Menyiapkan berkas..." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  headerTexts: { gap: 2 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 12 },
  headerIcon: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  exportRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10 },
  exportButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 10, paddingVertical: 9 },
  exportText: { fontSize: 12, fontWeight: '800' },
  content: { padding: 16, gap: 12 },
  statsGrid: { gap: 8 },
  statsRow: { flexDirection: 'row', gap: 8 },
  chartCard: { gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  empty: { fontSize: 12, textAlign: 'center', paddingVertical: 14 },
  listCard: { gap: 4 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  medal: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rankInfo: { flex: 1, gap: 1 },
  rankName: { fontSize: 12, fontWeight: '800' },
  rankMeta: { fontSize: 10 },
  rankRevenue: { fontSize: 12, fontWeight: '800' },
  invoiceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
  invoiceInfo: { flex: 1, gap: 2 },
  invoiceTitle: { fontSize: 13, fontWeight: '800' },
  invoiceHint: { fontSize: 11 },
  invoiceAction: { fontSize: 12, fontWeight: '800' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  historyCount: { fontSize: 11 },
  trxCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  trxTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trxNumber: { fontSize: 13, fontWeight: '800' },
  trxBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trxDate: { fontSize: 11 },
  trxAmount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trxTotal: { fontSize: 14, fontWeight: '900' },
});
