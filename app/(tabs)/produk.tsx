import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { AppIcon } from '@/shared/components/AppIcon';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { CustomTextField } from '@/shared/components/CustomTextField';
import { EmptyState } from '@/shared/components/EmptyState';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { SecondaryButton } from '@/shared/components/SecondaryButton';
import { SegmentedControl } from '@/shared/components/SegmentedControl';
import { useTheme } from '@/store/themeStore';
import {
  adjustStock,
  archiveProduct,
  getCategories,
  getProductById,
  getTopProducts,
  getTopStockProducts,
  listProducts,
  type Product,
} from '@/data/repositories/productRepository';
import { formatRupiah, formatQuantity, parseNumber } from '@/core/utils/currency';
import { fileExists } from '@/core/services/storageService';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';
import { ms } from '@/core/utils/scale';

type TabKey = 'semua' | 'terlaris' | 'stok';

export default function ProdukScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('semua');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [stockDialog, setStockDialog] = useState(false);
  const [stockDelta, setStockDelta] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const load = useCallback(async () => {
    const [list, cats] = await Promise.all([listProducts({ search, category: tab === 'semua' ? category : 'Semua' }), getCategories()]);
    setCategories(cats);
    if (tab === 'terlaris') {
      const top = await getTopProducts(20);
      const resolved = await Promise.all(top.map(async (row) => getProductById(row.product_id)));
      setProducts(resolved.filter((item): item is Product => Boolean(item)));
    } else if (tab === 'stok') {
      setProducts(await getTopStockProducts(50));
    } else {
      setProducts(list);
    }
  }, [search, category, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const chips = useMemo(() => ['Semua', ...categories], [categories]);
  const columns = 2;

  return (
    <Screen edges={['top']} padded={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Produk</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Kelola katalog dan stok barang</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppIcon name="nav_produk" size={16} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari produk..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      <View style={styles.segmentWrapper}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'semua', label: 'Semua' },
            { value: 'terlaris', label: 'Terlaris' },
            { value: 'stok', label: 'Stok Terbanyak' },
          ]}
        />
      </View>

      {tab === 'semua' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chips.map((chip) => (
            <Pressable
              key={chip}
              onPress={() => setCategory(chip)}
              style={[
                styles.chip,
                category === chip
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: 'transparent', borderColor: colors.border },
              ]}
            >
              <Text style={[styles.chipText, { color: category === chip ? '#FFFFFF' : colors.text }]}>{chip}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.gridScroll, { paddingBottom: insets.bottom + 120 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {products.length === 0 ? (
          <EmptyState
            icon="nav_produk"
            title="Belum ada produk"
            subtitle="Tambahkan produk pertama Anda"
          />
        ) : (
          <View style={styles.grid}>
            {products.map((product, index) => (
              <Pressable
                key={product.id}
                onPress={() => setSelected(product)}
                accessibilityRole="button"
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, width: `${100 / columns - 3}%` }]}
              >
                <View style={[styles.imageWrap, { backgroundColor: colors.surface }]}>
                  {product.image_path && fileExists(product.image_path) ? (
                    <Image source={{ uri: product.image_path }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <AppIcon name="nav_produk" size={34} />
                  )}
                  {index < 3 && tab === 'terlaris' ? (
                    <View style={styles.medal}>
                      <Text style={styles.medalText}>{index + 1}</Text>
                    </View>
                  ) : null}
                  {tab === 'stok' ? (
                    <View style={[styles.stockBadge, { backgroundColor: colors.success }]}>
                      <Text style={styles.stockBadgeText}>STOK</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={[styles.price, { color: colors.primary }]}>{formatRupiah(product.price)}</Text>
                <Text style={[styles.stock, { color: product.stock <= 5 ? colors.danger : colors.textMuted }]}>
                  Stok {formatQuantity(product.stock)} {product.unit}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/form-produk')}
        accessibilityRole="button"
        accessibilityLabel="Tambah produk"
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.danger,
            borderColor: colors.gold,
            bottom: insets.bottom + 92,
            width: ms(62),
            height: ms(62),
            borderRadius: ms(62) / 2,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <AppIcon name="produk_tambah" size={28} />
      </Pressable>

      {/* Detail sheet */}
      <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)} statusBarTranslucent>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            {selected ? (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={2}>
                    {selected.name}
                  </Text>
                  <Pressable onPress={() => setSelected(null)} accessibilityRole="button">
                    <Text style={[styles.close, { color: colors.textMuted }]}>Tutup</Text>
                  </Pressable>
                </View>
                <View style={styles.infoRows}>
                  <InfoRow label="Harga Jual" value={formatRupiah(selected.price)} />
                  <InfoRow label="Harga Modal" value={formatRupiah(selected.cost_price)} />
                  <InfoRow label="Stok" value={`${formatQuantity(selected.stock)} ${selected.unit}`} />
                  <InfoRow label="Barcode" value={selected.barcode || '-'} />
                  <InfoRow label="Kategori" value={selected.category} />
                </View>
                <View style={styles.sheetActions}>
                  <PrimaryButton
                    label="Edit Produk"
                    icon="produk_edit"
                    onPress={() => {
                      const id = selected.id;
                      setSelected(null);
                      router.push({ pathname: '/form-produk', params: { id } });
                    }}
                  />
                  <SecondaryButton
                    label="Penyesuaian Stok"
                    icon="produk_stok"
                    onPress={() => {
                      setStockDialog(true);
                      setStockDelta('');
                    }}
                  />
                  <SecondaryButton
                    label="Hapus Produk"
                    icon="produk_hapus"
                    color={colors.danger}
                    onPress={() => {
                      setDeleteTarget(selected);
                      setSelected(null);
                    }}
                  />
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Stock adjustment */}
      <Modal visible={stockDialog} transparent animationType="fade" onRequestClose={() => setStockDialog(false)} statusBarTranslucent>
        <View style={[styles.centered, { backgroundColor: colors.overlay }]}>
          <View style={[styles.dialog, { backgroundColor: colors.card }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Penyesuaian Stok</Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Masukkan delta (contoh: 5 untuk menambah, -2 untuk mengurangi).
            </Text>
            <CustomTextField
              value={stockDelta}
              onChangeText={setStockDelta}
              keyboardType="numbers-and-punctuation"
              placeholder="+/-"
              autoFocus
            />
            <View style={styles.dialogActions}>
              <SecondaryButton label="Batal" onPress={() => setStockDialog(false)} style={styles.flex} />
              <PrimaryButton
                label="Simpan"
                style={styles.flex}
                onPress={async () => {
                  if (!selected) return;
                  const delta = parseNumber(stockDelta);
                  if (!Number.isFinite(delta) || delta === 0) {
                    showBanner('Masukkan angka delta yang valid.', { type: 'error' });
                    return;
                  }
                  await adjustStock(selected.id, delta);
                  hapticSuccess();
                  setStockDialog(false);
                  showBanner('Stok diperbarui.', { type: 'success' });
                  await load();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="Hapus Produk"
        message={`"${deleteTarget?.name ?? ''}" akan diarsipkan dan tidak muncul lagi di daftar produk.`}
        confirmLabel="Hapus"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await archiveProduct(deleteTarget.id);
          setDeleteTarget(null);
          showBanner('Produk diarsipkan.', { type: 'success' });
          await load();
        }}
      />
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 12, marginTop: 2 },
  searchRow: { paddingHorizontal: 16, paddingTop: 6 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, minHeight: 44 },
  searchInput: { flex: 1, fontSize: 14 },
  segmentWrapper: { paddingHorizontal: 16, paddingTop: 10 },
  chips: { paddingHorizontal: 16, paddingTop: 12 },
  chip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  chipText: { fontSize: 12, fontWeight: '700' },
  gridScroll: { paddingHorizontal: 16, paddingTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { borderRadius: 12, borderWidth: 1, padding: 10, gap: 4, minHeight: 190 },
  imageWrap: { width: '100%', aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 6 },
  image: { width: '100%', height: '100%' },
  medal: { position: 'absolute', top: 6, left: 6, backgroundColor: '#D8A93E', borderRadius: 12, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  medalText: { color: '#0C3B6E', fontSize: 11, fontWeight: '900' },
  stockBadge: { position: 'absolute', top: 6, right: 6, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  stockBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  name: { fontSize: 13, fontWeight: '800' },
  price: { fontSize: 13, fontWeight: '800' },
  stock: { fontSize: 11, fontWeight: '600' },
  fab: { position: 'absolute', right: 18, borderWidth: 3, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, gap: 12 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '900', flex: 1 },
  close: { fontSize: 13, fontWeight: '700' },
  infoRows: { gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoLabel: { fontSize: 12, fontWeight: '600' },
  infoValue: { fontSize: 12, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  sheetActions: { gap: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 420, borderRadius: 16, padding: 18, gap: 12 },
  hint: { fontSize: 12 },
  dialogActions: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});
