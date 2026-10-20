import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { PageHeader } from '@/shared/components/PageHeader';
import { CustomTextField } from '@/shared/components/CustomTextField';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { DropdownField } from '@/shared/components/DropdownField';
import { ImagePickField } from '@/shared/components/ImagePickField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { LoadingOverlay } from '@/shared/components/LoadingOverlay';
import { ScannerModal } from '@/features/kasir/ScannerModal';
import { useTheme } from '@/store/themeStore';
import {
  addCustomCategory,
  addCustomUnit,
  createProduct,
  getCategoriesAll,
  getProductById,
  getUnitsAll,
  updateProduct,
  adjustStock,
} from '@/data/repositories/productRepository';
import { compressProductImage, deleteImageSafe } from '@/core/services/imageService';
import { showBanner } from '@/store/bannerStore';
import { parseNumber } from '@/core/utils/currency';
import { hapticSuccess } from '@/core/utils/haptics';

export default function FormProdukScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = typeof params.id === 'string' ? params.id : null;

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [stock, setStock] = useState('0');
  const [stockDelta, setStockDelta] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('lainnya');
  const [barcode, setBarcode] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [units, setUnits] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [scanVisible, setScanVisible] = useState(false);

  const load = useCallback(async () => {
    const [unitList, categoryList] = await Promise.all([getUnitsAll(), getCategoriesAll()]);
    setUnits(unitList);
    setCategories(categoryList);
    if (editingId) {
      const product = await getProductById(editingId);
      if (product) {
        setName(product.name);
        setPrice(product.price);
        setCost(product.cost_price);
        setStock(String(product.stock));
        setUnit(product.unit);
        setCategory(product.category);
        setBarcode(product.barcode ?? '');
        setImage(product.image_path);
        setOriginalImage(product.image_path);
      }
    }
  }, [editingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Nama produk wajib diisi.';
    if (price <= 0) nextErrors.price = 'Harga jual wajib lebih dari 0.';
    if (!unit) nextErrors.unit = 'Satuan wajib dipilih.';
    if (!category) nextErrors.category = 'Kategori wajib dipilih.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, {
          name,
          price,
          cost_price: cost,
          unit,
          category,
          barcode: barcode || null,
          image_path: image,
        });
        const delta = parseNumber(stockDelta);
        if (Number.isFinite(delta) && delta !== 0) await adjustStock(editingId, delta);
        if (originalImage && originalImage !== image) deleteImageSafe(originalImage);
      } else {
        const created = await createProduct({
          name,
          price,
          cost_price: cost,
          stock: parseNumber(stock) || 0,
          unit,
          category,
          barcode: barcode || null,
          image_path: image,
        });
        if (!created) throw new Error('create failed');
      }
      hapticSuccess();
      showBanner(editingId ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.', { type: 'success' });
      router.back();
    } catch {
      showBanner('Gagal menyimpan produk.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <PageHeader title={editingId ? 'Edit Produk' : 'Form Produk'} onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.imageWrapper}>
            <ImagePickField
              uri={image}
              size={150}
              icon="produk_upload"
              label="Unggah Gambar"
              loading={saving}
              onPick={async (picked) => {
                try {
                  const compressed = await compressProductImage(picked.uri, picked.width, picked.height);
                  setImage(compressed);
                } catch {
                  showBanner('Gagal memproses gambar.', { type: 'error' });
                }
              }}
            />
            <Text style={[styles.imageHint, { color: colors.textMuted }]}>JPG/PNG · otomatis dikompres 800×800 q0.7</Text>
          </View>

          <CustomTextField
            label="Nama Produk"
            required
            value={name}
            onChangeText={setName}
            placeholder="Contoh: Kertas HVS A4"
            error={errors.name}
          />
          <CurrencyInput label="Harga Jual" required value={price} onChange={setPrice} error={errors.price} />
          <CurrencyInput label="Harga Modal" value={cost} onChange={setCost} />

          <CustomTextField
            label="Stok"
            value={stock}
            onChangeText={setStock}
            keyboardType="decimal-pad"
            editable={!editingId}
            hint={editingId ? 'Stok tidak dapat diubah langsung saat edit — gunakan penyesuaian.' : undefined}
          />

          {editingId ? (
            <CustomTextField
              label="Penyesuaian Stok (+/-)"
              value={stockDelta}
              onChangeText={setStockDelta}
              keyboardType="numbers-and-punctuation"
              placeholder="Contoh: 5 atau -2"
            />
          ) : null}

          <DropdownField
            label="Satuan"
            required
            value={unit}
            options={units}
            onSelect={setUnit}
            onAddNew={async (value) => {
              const next = await addCustomUnit(value);
              setUnits(next);
            }}
            addLabel="Tambah Satuan"
            modalTitle="Pilih Satuan"
            error={errors.unit}
          />

          <DropdownField
            label="Kategori"
            required
            value={category}
            options={categories}
            onSelect={setCategory}
            onAddNew={async (value) => {
              const next = await addCustomCategory(value);
              setCategories(next);
            }}
            addLabel="Tambah Kategori"
            modalTitle="Pilih Kategori"
            error={errors.category}
          />

          <CustomTextField
            label="Barcode (opsional)"
            value={barcode}
            onChangeText={setBarcode}
            placeholder="Scan atau ketik barcode"
            suffixIcon="kasir_scan"
            onSuffixPress={() => setScanVisible(true)}
          />

          <PrimaryButton
            label={editingId ? 'Simpan Perubahan' : 'Simpan Produk'}
            onPress={() => void save()}
            loading={saving}
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ScannerModal
        visible={scanVisible}
        onClose={() => setScanVisible(false)}
        onScanned={(code) => {
          setBarcode(code);
          setScanVisible(false);
        }}
      />
      <LoadingOverlay visible={saving} label="Menyimpan produk..." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  imageWrapper: { alignItems: 'center', gap: 6 },
  imageHint: { fontSize: 10 },
  submit: { marginTop: 8 },
});
