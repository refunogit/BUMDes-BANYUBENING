import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { PageHeader } from '@/shared/components/PageHeader';
import { CustomTextField } from '@/shared/components/CustomTextField';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { useTheme } from '@/store/themeStore';
import { listPlnCustomers, savePlnCustomer, type PlnCustomer } from '@/data/repositories/plnCustomerRepository';
import { useCartStore, type ListrikServiceData } from '@/store/cartStore';
import { ceil500 } from '@/core/utils/ceil500';
import { formatRupiah, formatPlain, parseNumber } from '@/core/utils/currency';
import { MONTH_NAMES } from '@/core/utils/date';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';

export default function FormListrikScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const addServiceItem = useCartStore((s) => s.addServiceItem);

  const [customers, setCustomers] = useState<PlnCustomer[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [idpel, setIdpel] = useState('');
  const [nama, setNama] = useState('');
  const [tarifDaya, setTarifDaya] = useState('');
  const [bl, setBl] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [th, setTh] = useState(String(new Date().getFullYear()));
  const [kwh, setKwh] = useState('');
  const [tagihan, setTagihan] = useState(0);
  const [admBank, setAdmBank] = useState(0);
  const [biayaLyn, setBiayaLyn] = useState(0);
  const [denda, setDenda] = useState(0);
  const [monthPicker, setMonthPicker] = useState<'bl' | 'th' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadCustomers = useCallback(async () => {
    setCustomers(await listPlnCustomers(''));
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const total = useMemo(() => ceil500(tagihan + admBank + biayaLyn + denda), [tagihan, admBank, biayaLyn, denda]);

  const filtered = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(search.toLowerCase()) || customer.idpel.includes(search.trim()),
  );

  const addToCart = async () => {
    const nextErrors: Record<string, string> = {};
    if (!idpel.trim()) nextErrors.idpel = 'IDPEL wajib diisi.';
    if (!nama.trim()) nextErrors.nama = 'Nama pelanggan wajib diisi.';
    if (total <= 0) nextErrors.tagihan = 'Tagihan wajib lebih dari 0.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    await savePlnCustomer({ idpel, name: nama, daya: tarifDaya });
    await loadCustomers();

    const serviceData: ListrikServiceData = {
      type: 'listrik',
      idpel: idpel.trim(),
      nama: nama.trim(),
      tarifDaya: tarifDaya.trim(),
      tagihan,
      kwh: parseNumber(kwh) || 0,
      bl,
      th,
      admBank,
      biayaLyn,
      denda,
      total,
    };

    addServiceItem({
      name: `Listrik ${nama.trim()}`,
      price: total,
      unit: 'jasa',
      serviceType: 'listrik',
      serviceData,
      costAmount: tagihan + admBank + denda,
    });
    hapticSuccess();
    showBanner('Tagihan listrik masuk keranjang.', { type: 'success' });
    router.back();
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <PageHeader title="Tagihan Listrik" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => setPickerVisible(true)}
          style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Text style={[styles.pickerLabel, { color: colors.text }]}>Pilih Pelanggan</Text>
          <Text style={[styles.pickerHint, { color: colors.textMuted }]}>
            {customers.length ? `${customers.length} pelanggan tersimpan` : 'Belum ada pelanggan tersimpan'}
          </Text>
        </Pressable>

        <CustomTextField label="IDPEL" required value={idpel} onChangeText={setIdpel} keyboardType="number-pad" error={errors.idpel} />
        <CustomTextField label="NAMA" required value={nama} onChangeText={setNama} error={errors.nama} />
        <CustomTextField label="TRF/DAYA" value={tarifDaya} onChangeText={setTarifDaya} placeholder="Contoh: R1/1300" />

        <View style={styles.row}>
          <View style={styles.flex}>
            <Pressable
              onPress={() => setMonthPicker('bl')}
              style={[styles.dateField, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
            >
              <Text style={[styles.dateLabel, { color: colors.textMuted }]}>BL</Text>
              <Text style={[styles.dateValue, { color: colors.text }]}>{bl}</Text>
            </Pressable>
          </View>
          <View style={styles.flex}>
            <Pressable
              onPress={() => setMonthPicker('th')}
              style={[styles.dateField, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
            >
              <Text style={[styles.dateLabel, { color: colors.textMuted }]}>TH</Text>
              <Text style={[styles.dateValue, { color: colors.text }]}>{th}</Text>
            </Pressable>
          </View>
          <View style={styles.flex}>
            <CustomTextField label="PEMAKAIAN (KWH)" value={kwh} onChangeText={setKwh} keyboardType="number-pad" />
          </View>
        </View>

        <CurrencyInput label="TAGIHAN" required value={tagihan} onChange={setTagihan} error={errors.tagihan} />
        <CurrencyInput label="ADM BANK" value={admBank} onChange={setAdmBank} />
        <CurrencyInput label="BIAYA LYN" value={biayaLyn} onChange={setBiayaLyn} />
        <CurrencyInput label="DENDA" value={denda} onChange={setDenda} />

        <View style={[styles.totalBox, { backgroundColor: colors.surface, borderColor: colors.gold }]}>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL (dibulatkan Rp 500)</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>{formatRupiah(total)}</Text>
          <Text style={[styles.totalHint, { color: colors.textMuted }]}>
            TAGIHAN {formatPlain(tagihan)} + ADM {formatPlain(admBank)} + LYN {formatPlain(biayaLyn)} + DENDA {formatPlain(denda)}
          </Text>
        </View>

        <PrimaryButton label="Tambah ke Keranjang" onPress={() => void addToCart()} icon="kasir_keranjang" />
      </ScrollView>

      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)} statusBarTranslucent>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Pilih Pelanggan Listrik</Text>
              <Pressable onPress={() => setPickerVisible(false)}>
                <Text style={[styles.close, { color: colors.textMuted }]}>Tutup</Text>
              </Pressable>
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Cari nama atau IDPEL..."
              placeholderTextColor={colors.textMuted}
              style={[styles.search, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
            />
            <ScrollView style={styles.list}>
              {filtered.map((customer) => (
                <Pressable
                  key={customer.id}
                  onPress={() => {
                    setIdpel(customer.idpel);
                    setNama(customer.name);
                    setTarifDaya(customer.daya ?? '');
                    setPickerVisible(false);
                  }}
                  style={[styles.customerRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.customerName, { color: colors.text }]}>{customer.name}</Text>
                  <Text style={[styles.customerMeta, { color: colors.textMuted }]}>
                    {customer.idpel} · {customer.daya ?? '-'}
                  </Text>
                </Pressable>
              ))}
              {filtered.length === 0 ? (
                <Text style={[styles.empty, { color: colors.textMuted }]}>Belum ada pelanggan. Simpan otomatis saat transaksi pertama.</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(monthPicker)} transparent animationType="fade" onRequestClose={() => setMonthPicker(null)} statusBarTranslucent>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.dialog, { backgroundColor: colors.card }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {monthPicker === 'bl' ? 'Pilih Bulan' : 'Pilih Tahun'}
            </Text>
            <ScrollView style={styles.list}>
              {(monthPicker === 'bl'
                ? MONTH_NAMES.map((name, index) => ({ label: name, value: String(index + 1).padStart(2, '0') }))
                : Array.from({ length: 7 }, (_, index) => String(new Date().getFullYear() - 3 + index)).map((value) => ({ label: value, value }))
              ).map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    if (monthPicker === 'bl') setBl(option.value);
                    else setTh(option.value);
                    setMonthPicker(null);
                  }}
                  style={[styles.option, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.customerName, { color: colors.text }]}>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  pickerButton: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 2 },
  pickerLabel: { fontSize: 13, fontWeight: '800' },
  pickerHint: { fontSize: 11 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  flex: { flex: 1, minWidth: 0 },
  dateField: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, minHeight: 48, justifyContent: 'center', gap: 1 },
  dateLabel: { fontSize: 10, fontWeight: '700' },
  dateValue: { fontSize: 14, fontWeight: '800' },
  totalBox: { borderWidth: 1.5, borderRadius: 12, padding: 14, gap: 4 },
  totalLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  totalValue: { fontSize: 26, fontWeight: '900' },
  totalHint: { fontSize: 10 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '82%', gap: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 17, fontWeight: '900' },
  close: { fontSize: 13, fontWeight: '700' },
  search: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minHeight: 42 },
  list: { maxHeight: 300 },
  customerRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 2 },
  customerName: { fontSize: 13, fontWeight: '800' },
  customerMeta: { fontSize: 11 },
  empty: { fontSize: 12, paddingVertical: 14 },
  dialog: { margin: 24, borderRadius: 16, padding: 16, gap: 8, maxHeight: '70%' },
  option: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
