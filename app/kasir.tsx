import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';

import { AppIcon } from '@/shared/components/AppIcon';
import { EmptyState } from '@/shared/components/EmptyState';
import { CartPanel } from '@/features/kasir/CartPanel';
import { ScannerModal } from '@/features/kasir/ScannerModal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useTheme } from '@/store/themeStore';
import { useCartStore } from '@/store/cartStore';
import { getCategories, getProductByBarcode, listProducts, type Product } from '@/data/repositories/productRepository';
import { formatRupiah, formatQuantity } from '@/core/utils/currency';
import { fileExists } from '@/core/services/storageService';
import { showBanner } from '@/store/bannerStore';
import { hapticLight } from '@/core/utils/haptics';

const DIVIDER = '#DDE3EA';

export default function KasirScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const itemCount = useCartStore((s) => s.items.length);
  const clearCart = useCartStore((s) => s.clearCart);
  const [exitDialog, setExitDialog] = useState(false);
  const [mode, setMode] = useState<'produk' | 'jasa'>('produk');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);

  const requestClose = useCallback(() => {
    if (itemCount > 0) {
      setExitDialog(true);
      return;
    }
    router.back();
  }, [itemCount, router]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestClose();
      return true;
    });
    return () => subscription.remove();
  }, [requestClose]);

  const windowWidth = Dimensions.get('window').width;
  const columns = windowWidth > 1100 ? 5 : windowWidth > 800 ? 4 : 3;

  useFocusEffect(
    useCallback(() => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => undefined);
      return () => {
        void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);
      };
    }, []),
  );

  const load = useCallback(async () => {
    const [list, cats] = await Promise.all([listProducts({ search, category }), getCategories()]);
    setProducts(list);
    setCategories(cats);
  }, [search, category]);

  useEffect(() => {
    void load();
  }, [load]);

  const addProduct = (product: Product) => {
    hapticLight();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      costPrice: product.cost_price,
      imagePath: product.image_path,
    });
  };

  const chips = useMemo(() => ['Semua', ...categories], [categories]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.appBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={requestClose} accessibilityRole="button" accessibilityLabel="Kembali" style={styles.backPill}>
          <AppIcon name="panah_kembali" size={16} tintColor={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Kembali</Text>
        </Pressable>
        <Text style={[styles.appTitle, { color: colors.text }]}>KASIR</Text>
        <Pressable
          onPress={() => setScannerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Pindai barcode"
          style={[styles.scanButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppIcon name="kasir_scan" size={22} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.leftPanel}>
          <View style={styles.searchRow}>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <AppIcon name="kasir_scan" size={16} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Cari produk..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>
          </View>

          <View style={[styles.segment, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {(['produk', 'jasa'] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => setMode(value)}
                style={[styles.segmentItem, mode === value && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.segmentText, { color: mode === value ? '#FFFFFF' : colors.textMuted }]}>
                  {value === 'produk' ? 'Produk' : 'Layanan Jasa'}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === 'produk' ? (
            <>
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
              <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
                {products.length === 0 ? (
                  <EmptyState icon="nav_produk" title="Belum ada produk" subtitle="Tambahkan produk terlebih dahulu" />
                ) : (
                  <View style={styles.gridRow}>
                    {products.map((product) => (
                      <Pressable
                        key={product.id}
                        onPress={() => addProduct(product)}
                        accessibilityRole="button"
                        accessibilityLabel={product.name}
                        style={({ pressed }) => [
                          styles.productCard,
                          {
                            width: `${100 / columns - 2}%`,
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <View style={[styles.productImage, { backgroundColor: colors.surface }]}>
                          {product.image_path && fileExists(product.image_path) ? (
                            <Image source={{ uri: product.image_path }} style={styles.productImageInner} resizeMode="cover" />
                          ) : (
                            <AppIcon name="nav_produk" size={26} />
                          )}
                        </View>
                        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={[styles.productPrice, { color: colors.primary }]}>{formatRupiah(product.price)}</Text>
                        <Text style={[styles.productStock, { color: product.stock <= 5 ? colors.danger : colors.textMuted }]}>
                          {formatQuantity(product.stock)} {product.unit}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </ScrollView>
            </>
          ) : (
            <ScrollView contentContainerStyle={styles.services}>
              <Pressable
                onPress={() => router.push('/form-listrik')}
                style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <AppIcon name="pln_upload" size={34} />
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceTitle, { color: colors.text }]}>Token / Tagihan Listrik</Text>
                  <Text style={[styles.serviceHint, { color: colors.textMuted }]}>PLN — total dibulatkan ke atas Rp 500</Text>
                </View>
                <AppIcon name="panah_naik" size={18} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/form-pulsa')}
                style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <AppIcon name="kasir_bayar" size={34} />
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceTitle, { color: colors.text }]}>Pulsa / Paket Data</Text>
                  <Text style={[styles.serviceHint, { color: colors.textMuted }]}>Isi ulang pulsa dan paket data</Text>
                </View>
                <AppIcon name="panah_naik" size={18} />
              </Pressable>
            </ScrollView>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: DIVIDER }]} />
        <View style={styles.rightPanel}>
          <CartPanel onCheckout={() => router.push('/payment')} />
        </View>
      </View>

      <ConfirmDialog
        visible={exitDialog}
        title="Keluar dari Kasir?"
        message="Keranjang yang belum dibayar akan dikosongkan."
        confirmLabel="Keluar"
        destructive
        onCancel={() => setExitDialog(false)}
        onConfirm={() => {
          setExitDialog(false);
          clearCart();
          router.back();
        }}
      />

      <ScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={async (code) => {
          setScannerVisible(false);
          hapticLight();
          const found = await getProductByBarcode(code);
          if (found) {
            addProduct(found);
          } else {
            showBanner(`Barcode "${code}" tidak ditemukan di daftar produk.`, {
              type: 'error',
              action: { label: 'Tambah Produk', onPress: () => router.push('/form-produk') },
            });
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  backPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 18 },
  backText: { fontSize: 12, fontWeight: '800' },
  appTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  scanButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  body: { flex: 1, flexDirection: 'row', padding: 10, gap: 10 },
  leftPanel: { flex: 1, gap: 8, minWidth: 0 },
  rightPanel: { flex: 1, minWidth: 0 },
  divider: { width: 1, marginVertical: 4 },
  searchRow: { flexDirection: 'row' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, height: 40 },
  searchInput: { flex: 1, fontSize: 13 },
  segment: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 3, gap: 3 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  segmentText: { fontSize: 12, fontWeight: '800' },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { fontSize: 11, fontWeight: '700' },
  grid: { paddingBottom: 14 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  productCard: { borderRadius: 12, borderWidth: 1, padding: 8, gap: 3 },
  productImage: { width: '100%', aspectRatio: 1.25, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 },
  productImageInner: { width: '100%', height: '100%' },
  productName: { fontSize: 11, fontWeight: '800' },
  productPrice: { fontSize: 11, fontWeight: '800' },
  productStock: { fontSize: 10, fontWeight: '600' },
  services: { gap: 10, paddingVertical: 8 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
  serviceInfo: { flex: 1, gap: 2 },
  serviceTitle: { fontSize: 13, fontWeight: '800' },
  serviceHint: { fontSize: 11 },
});
