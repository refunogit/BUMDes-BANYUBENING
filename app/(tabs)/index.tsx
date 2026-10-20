import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClockPanel } from '@/features/dashboard/ClockPanel';
import { RunningText } from '@/features/dashboard/RunningText';
import { DashboardHeader } from '@/features/dashboard/DashboardHeader';
import { MainMenuGrid, type MenuTile } from '@/features/dashboard/MainMenuGrid';
import { TrendChartCard } from '@/features/dashboard/TrendChartCard';
import { StockAlertCard } from '@/features/dashboard/StockAlertCard';
import { StatCard } from '@/shared/components/StatCard';
import { Card } from '@/shared/components/Card';
import { AppIcon } from '@/shared/components/AppIcon';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useTheme, useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { setSetting, getSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { getSalesStats, getDailySales } from '@/data/repositories/transactionRepository';
import { getDashboardProfit } from '@/data/repositories/accountingRepository';
import { getLowStockProducts, listProducts, type LowStockProduct, type Product } from '@/data/repositories/productRepository';
import { addDays, endOfDay, startOfDay } from '@/core/utils/date';
import { formatRupiah, formatQuantity } from '@/core/utils/currency';
import { fileExists } from '@/core/services/storageService';
import { showBanner } from '@/store/bannerStore';

type DashboardData = {
  storeName: string;
  adminName: string;
  logoUri: string | null;
  productCount: number;
  todayRevenue: number;
  todayTrx: number;
  todayItems: number;
  yesterdayRevenue: number;
  gross: number;
  net: number;
  daily: { date: string; revenue: number; transactions: number }[];
  monthTotal: number;
  lowStock: LowStockProduct[];
  products: Product[];
};

const EMPTY: DashboardData = {
  storeName: 'BUMDes',
  adminName: 'Kasir',
  logoUri: null,
  productCount: 0,
  todayRevenue: 0,
  todayTrx: 0,
  todayItems: 0,
  yesterdayRevenue: 0,
  gross: 0,
  net: 0,
  daily: [],
  monthTotal: 0,
  lowStock: [],
  products: [],
};

export default function DashboardScreen(): React.ReactElement {
  const { colors, isDark } = useTheme();
  const toggleTheme = useThemeStore((s) => s.toggle);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [refreshing, setRefreshing] = useState(false);
  const [lockVisible, setLockVisible] = useState(false);

  const load = useCallback(async () => {
    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();
    const yesterdayStart = startOfDay(addDays(now, -1)).toISOString();
    const yesterdayEnd = endOfDay(addDays(now, -1)).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [today, yesterday, daily, profit, lowStock, products, name, adminName, logo, month] = await Promise.all([
      getSalesStats(todayStart, todayEnd),
      getSalesStats(yesterdayStart, yesterdayEnd),
      getDailySales(7),
      getDashboardProfit(),
      getLowStockProducts(6),
      listProducts(),
      getSetting(SETTINGS_KEYS.bumdesNama, 'BUMDes'),
      getSetting(SETTINGS_KEYS.userNamaLengkap, authUser?.displayName ?? 'Kasir'),
      getSetting(SETTINGS_KEYS.bumdesLogo),
      getSalesStats(monthStart, todayEnd),
    ]);

    setData({
      storeName: name ?? 'BUMDes',
      adminName: adminName ?? 'Kasir',
      logoUri: fileExists(logo) ? logo : null,
      productCount: products.length,
      todayRevenue: today.revenue,
      todayTrx: today.transactions,
      todayItems: today.itemsSold,
      yesterdayRevenue: yesterday.revenue,
      gross: profit.gross,
      net: profit.net,
      daily,
      monthTotal: month.revenue,
      lowStock,
      products: products.slice(0, 6),
    });
  }, [authUser?.displayName]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const closeBook = async () => {
    await setSetting(SETTINGS_KEYS.lastCloseBookDate, new Date().toISOString());
    setLockVisible(false);
    await load();
    showBanner('Pembukuan ditutup. Laba kotor dimulai dari Rp 0.', { type: 'success' });
  };

  const delta =
    data.yesterdayRevenue > 0 ? ((data.todayRevenue - data.yesterdayRevenue) / data.yesterdayRevenue) * 100 : null;
  const average = data.todayTrx > 0 ? data.todayRevenue / data.todayTrx : 0;

  const tiles: MenuTile[] = [
    { key: 'kasir', label: 'Kasir', icon: 'dash_menu_kasir', tint: colors.primary, onPress: () => router.push('/kasir') },
    { key: 'produk', label: 'Produk', icon: 'dash_menu_produk', tint: colors.navy, onPress: () => router.push('/produk') },
    { key: 'laporan', label: 'Laporan', icon: 'dash_menu_laporan', tint: colors.gold, onPress: () => router.push('/riwayat') },
    { key: 'hutang', label: 'Hutang', icon: 'dash_menu_hutang', tint: colors.danger, onPress: () => router.push('/hutang') },
    { key: 'keuangan', label: 'Keuangan', icon: 'dash_menu_laporan', tint: colors.success, onPress: () => router.push('/keuangan') },
    { key: 'pengaturan', label: 'Pengaturan', icon: 'dash_menu_pengaturan', tint: colors.textMuted, onPress: () => router.push('/pengaturan') },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={{ paddingTop: insets.top, backgroundColor: isDark ? colors.navy : colors.primary }}>
        <DashboardHeader
          storeName={data.storeName}
          adminName={data.adminName}
          logoUri={data.logoUri}
          gross={data.gross}
          net={data.net}
          onToggleTheme={toggleTheme}
          onLock={() => setLockVisible(true)}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <ClockPanel />
        <RunningText
          messages={[
            `Selamat datang di ${data.storeName}`,
            `Penjualan hari ini ${formatRupiah(data.todayRevenue)}`,
            `${data.todayTrx} transaksi hari ini`,
            `${data.lowStock.length} produk perlu restok`,
          ]}
        />

        <View style={styles.statsRow}>
          <StatCard label="Produk" value={String(data.productCount)} icon="nav_produk" />
          <StatCard label="Transaksi Hari Ini" value={String(data.todayTrx)} icon="nav_riwayat" tint={colors.gold} />
          <StatCard label="Item Terjual Hari Ini" value={formatQuantity(data.todayItems)} icon="kasir_keranjang" tint={colors.success} />
        </View>

        <Card style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={[styles.heroLabel, { color: colors.textMuted }]}>Penjualan Hari Ini</Text>
            {delta !== null ? (
              <View style={[styles.badge, { backgroundColor: delta >= 0 ? '#16A34A18' : '#D6454518' }]}>
                <AppIcon name={delta >= 0 ? 'panah_naik' : 'panah_turun'} size={12} />
                <Text style={[styles.badgeText, { color: delta >= 0 ? colors.success : colors.danger }]}>
                  {delta >= 0 ? '+' : ''}
                  {delta.toFixed(1)}%
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.heroValue, { color: colors.primary }]} adjustsFontSizeToFit numberOfLines={1}>
            {formatRupiah(data.todayRevenue)}
          </Text>
          <View style={styles.heroFooter}>
            <View style={styles.heroCell}>
              <Text style={[styles.heroCellLabel, { color: colors.textMuted }]}>Kemarin</Text>
              <Text style={[styles.heroCellValue, { color: colors.text }]}>{formatRupiah(data.yesterdayRevenue)}</Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroCell}>
              <Text style={[styles.heroCellLabel, { color: colors.textMuted }]}>Rata-rata</Text>
              <Text style={[styles.heroCellValue, { color: colors.text }]}>
                {formatRupiah(average)}
                <Text style={{ fontSize: 10, color: colors.textMuted }}>/trx</Text>
              </Text>
            </View>
          </View>
        </Card>

        <TrendChartCard points={data.daily} monthTotal={data.monthTotal} />
        <StockAlertCard items={data.lowStock} onPress={() => router.push('/produk')} />
        <MainMenuGrid tiles={tiles} />

        <Card style={styles.products}>
          <View style={styles.productsHeader}>
            <Text style={[styles.productsTitle, { color: colors.text }]}>Produk Tersedia</Text>
            <Pressable onPress={() => router.push('/produk')} accessibilityRole="button">
              <Text style={[styles.seeAll, { color: colors.primary }]}>Lihat Semua</Text>
            </Pressable>
          </View>
          {data.products.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>Belum ada produk.</Text>
          ) : (
            data.products.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => router.push('/produk')}
                style={[styles.productRow, { borderTopColor: colors.border }]}
                accessibilityRole="button"
              >
                {product.image_path && fileExists(product.image_path) ? (
                  <Image source={{ uri: product.image_path }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: colors.surface }]}>
                    <AppIcon name="nav_produk" size={20} />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productPrice, { color: colors.primary }]}>{formatRupiah(product.price)}</Text>
                </View>
                <Text style={[styles.productStock, { color: product.stock <= 5 ? colors.danger : colors.textMuted }]}>
                  {formatQuantity(product.stock)} {product.unit}
                </Text>
              </Pressable>
            ))
          )}
        </Card>
      </ScrollView>

      <ConfirmDialog
        visible={lockVisible}
        title="Tutup Pembukuan"
        message={
          'Apakah Anda yakin ingin menutup pembukuan?\n\nLaba Kotor akan direset ke Rp 0 dan data transaksi bulan ini akan diarsipkan.\nData lama tetap bisa dilihat di Laporan.'
        }
        confirmLabel="Ya, Tutup"
        cancelLabel="Batal"
        onConfirm={closeBook}
        onCancel={() => setLockVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 12, gap: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },
  hero: { gap: 4 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 12, fontWeight: '700' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  heroValue: { fontSize: 28, fontWeight: '900', marginTop: 2 },
  heroFooter: { flexDirection: 'row', marginTop: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#00000010' },
  heroCell: { flex: 1, gap: 2 },
  heroCellLabel: { fontSize: 10, fontWeight: '700' },
  heroCellValue: { fontSize: 13, fontWeight: '800' },
  heroDivider: { width: 1, marginHorizontal: 10 },
  products: { gap: 8 },
  productsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productsTitle: { fontSize: 13, fontWeight: '900' },
  seeAll: { fontSize: 12, fontWeight: '800' },
  empty: { fontSize: 12, paddingVertical: 10 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  thumb: { width: 38, height: 38, borderRadius: 8 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, gap: 2 },
  productName: { fontSize: 12, fontWeight: '700' },
  productPrice: { fontSize: 12, fontWeight: '800' },
  productStock: { fontSize: 11, fontWeight: '700' },
});
