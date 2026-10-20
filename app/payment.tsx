import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppIcon } from '@/shared/components/AppIcon';
import { Badge } from '@/shared/components/Badge';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { CustomTextField } from '@/shared/components/CustomTextField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { SecondaryButton } from '@/shared/components/SecondaryButton';
import { LoadingOverlay } from '@/shared/components/LoadingOverlay';
import { useTheme } from '@/store/themeStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { usePrinterStore } from '@/store/printerStore';
import { usePrintFlow } from '@/features/printer/usePrintFlow';
import { createTransaction } from '@/data/repositories/transactionRepository';
import { listCustomers, createCustomer, type Customer } from '@/data/repositories/customerRepository';
import { getSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { formatPlain, formatRupiah, parseNumber } from '@/core/utils/currency';
import { DAY_NAMES, MONTH_NAMES, formatDateLong, formatTime } from '@/core/utils/date';
import { showBanner } from '@/store/bannerStore';
import { hapticLight, hapticSuccess } from '@/core/utils/haptics';
import { fileExists } from '@/core/services/storageService';
import { writeLog } from '@/core/services/logService';
import { sh, ms } from '@/core/utils/scale';

type Method = 'cash' | 'qris' | 'credit';

export default function PaymentScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);
  const authUser = useAuthStore((s) => s.user);
  const autoPrint = usePrinterStore((s) => s.autoPrint);
  const { printTransactionById } = usePrintFlow();

  const [method, setMethod] = useState<Method>('cash');
  const [cashText, setCashText] = useState('');
  const [adminFee, setAdminFee] = useState(0);
  const [receivedText, setReceivedText] = useState('');
  const [reference, setReference] = useState('');
  const [qrisUri, setQrisUri] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerModal, setCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const cash = parseNumber(cashText) || 0;
  const received = parseNumber(receivedText) || 0;
  const grandTotal = method === 'qris' ? total + adminFee : total;
  const change = Math.max(0, cash - total);
  const qrisChange = Math.max(0, received - grandTotal);
  const insufficient = method === 'cash' && cash > 0 && cash < total;
  const now = new Date();

  const load = useCallback(async () => {
    const [qris, list] = await Promise.all([
      getSetting(SETTINGS_KEYS.qrisImage),
      listCustomers(''),
    ]);
    setQrisUri(fileExists(qris) ? qris : null);
    setCustomers(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (method === 'qris') {
      setReceivedText(formatPlain(total + adminFee));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, total, adminFee]);

  const keypad = useMemo(
    () => [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['C', '0', '⌫'],
    ],
    [],
  );

  const pressKey = (key: string) => {
    hapticLight();
    if (method !== 'cash') return;
    if (key === 'C') {
      setCashText('');
      return;
    }
    if (key === '⌫') {
      setCashText((current) => current.slice(0, -1));
      return;
    }
    setCashText((current) => (current === '0' ? key : current + key));
  };

  const openWhatsApp = () => {
    if (!customer) {
      showBanner('Pilih pelanggan terlebih dahulu.', { type: 'error' });
      return;
    }
    const phone = (customer.phone ?? '').replace(/[^\d]/g, '');
    const message = `Yth ${customer.name}, tagihan belanja Anda sebesar ${formatRupiah(grandTotal)} jatuh tempo hari ini. Mohon segera lakukan pembayaran. Terima kasih.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    void Linking.openURL(url).catch(() => showBanner('Tidak dapat membuka WhatsApp.', { type: 'error' }));
  };

  const confirmPayment = async () => {
    if (!items.length) {
      showBanner('Keranjang kosong.', { type: 'error' });
      return;
    }
    if (method === 'cash' && cash < total) {
      showBanner('Jumlah tunai kurang dari total pembayaran.', { type: 'error' });
      return;
    }
    if (method === 'credit' && !customer) {
      showBanner('Pilih pelanggan untuk pembayaran piutang.', { type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const transaction = await createTransaction({
        total,
        paymentMethod: method,
        cashAmount: method === 'cash' ? cash : method === 'qris' ? received : 0,
        changeAmount: method === 'cash' ? change : method === 'qris' ? qrisChange : 0,
        adminFee: method === 'qris' ? adminFee : 0,
        paymentReference: method === 'qris' ? reference.trim() || null : null,
        userId: authUser?.id ?? null,
        customerId: customer?.id ?? null,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          unit: item.unit,
          quantity: item.qty,
          price: item.price,
          subtotal: Math.round(item.price * item.qty * 100) / 100,
          costAmount:
            item.costAmount ??
            (item.serviceType === 'listrik' && item.serviceData?.type === 'listrik'
              ? item.serviceData.tagihan + item.serviceData.admBank + item.serviceData.denda
              : item.serviceType === 'pulsa'
                ? 0
                : item.costPrice * item.qty),
          serviceData: item.serviceData,
        })),
      });
      hapticSuccess();
      setSuccessVisible(true);
      if (autoPrint) {
        void printTransactionById(transaction.id, { auto: true });
      }
      clearCart();
      setTimeout(() => {
        setSuccessVisible(false);
        router.back();
      }, 900);
    } catch (error) {
      writeLog('payment', 'save failed', error);
      showBanner('Pembayaran gagal disimpan. Coba lagi.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Kembali" style={styles.back}>
          <AppIcon name="panah_kembali" size={18} tintColor={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Kembali</Text>
        </Pressable>
        <View style={styles.headerTitle}>
          <View style={[styles.accent, { backgroundColor: colors.gold }]} />
          <Text style={[styles.title, { color: colors.text }]}>Pembayaran</Text>
        </View>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.totalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total Pembayaran</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]} adjustsFontSizeToFit numberOfLines={1}>
            {formatRupiah(grandTotal)}
          </Text>
          <Badge label={`${items.length} item`} tone="muted" />
        </View>

        <View style={[styles.methodRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(['cash', 'qris', 'credit'] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => setMethod(value)}
              style={[styles.methodItem, method === value && { backgroundColor: colors.primary }]}
              accessibilityRole="button"
            >
              <Text style={[styles.methodText, { color: method === value ? '#FFFFFF' : colors.textMuted }]}>
                {value === 'cash' ? 'Tunai' : value === 'qris' ? 'QRIS' : 'Piutang'}
              </Text>
            </Pressable>
          ))}
        </View>

        {method === 'cash' ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Jumlah Tunai</Text>
            <View style={[styles.cashBox, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
              <Text style={[styles.cashPrefix, { color: colors.textMuted }]}>Rp</Text>
              <Text style={[styles.cashValue, { color: colors.text }]} numberOfLines={1}>
                {cashText ? formatPlain(Number(cashText)) : '0'}
              </Text>
              <Text style={[styles.cashBig, { color: insufficient ? colors.danger : colors.success }]}>
                {insufficient ? `Kurang ${formatRupiah(total - cash)}` : `Kembali ${formatRupiah(change)}`}
              </Text>
            </View>

            <View style={styles.quickRow}>
              {[0, 50000, 100000, 200000].map((value) => (
                <Pressable
                  key={value}
                  onPress={() => {
                    hapticLight();
                    setCashText(String(value === 0 ? total : value));
                  }}
                  style={[styles.quick, { borderColor: colors.primary }]}
                >
                  <Text style={[styles.quickText, { color: colors.primary }]}>{value === 0 ? 'Uang Pas' : formatPlain(value)}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.keypad}>
              {keypad.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.keypadRow}>
                  {row.map((key) => (
                    <Pressable
                      key={key}
                      onPress={() => pressKey(key)}
                      style={[styles.key, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    >
                      <Text style={[styles.keyText, { color: key === 'C' ? colors.danger : colors.navy }]}>{key}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {method === 'qris' ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.qrWrapper}>
              {qrisUri ? (
                <Image source={{ uri: qrisUri }} style={styles.qrImage} resizeMode="contain" />
              ) : (
                <View style={[styles.qrPlaceholder, { borderColor: colors.border }]}>
                  <AppIcon name="kasir_scan" size={34} />
                  <Text style={[styles.qrHint, { color: colors.textMuted }]}>
                    QRIS Toko belum diunggah — unggah di Pengaturan
                  </Text>
                </View>
              )}
            </View>
            <CustomTextField
              label="Admin (opsional)"
              value={adminFee ? formatPlain(adminFee) : ''}
              onChangeText={(value) => setAdminFee(parseNumber(value) || 0)}
              keyboardType="number-pad"
              prefix="Rp "
            />
            <CustomTextField
              label="Nominal Diterima"
              value={receivedText}
              onChangeText={setReceivedText}
              keyboardType="number-pad"
              prefix="Rp "
            />
            <CustomTextField
              label="Referensi (opsional)"
              value={reference}
              onChangeText={setReference}
              placeholder="No. referensi QRIS"
            />
            <Text style={[styles.helper, { color: qrisChange > 0 ? colors.success : colors.textMuted }]}>
              Kembali {formatRupiah(qrisChange)}
            </Text>
          </View>
        ) : null}

        {method === 'credit' ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Pilih Pelanggan</Text>
            <Pressable
              onPress={() => setCustomerModal(true)}
              style={[styles.customerBox, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
            >
              <Text style={[styles.customerName, { color: customer ? colors.text : colors.textMuted }]}>
                {customer ? customer.name : 'Belum dipilih'}
              </Text>
              <Text style={[styles.customerPhone, { color: colors.textMuted }]}>{customer?.phone ?? 'Tap untuk memilih'}</Text>
            </Pressable>
            <SecondaryButton label="Ingatkan via WA" icon="panah_naik" onPress={openWhatsApp} />
            <Text style={[styles.helper, { color: colors.textMuted }]}>
              Piutang otomatis jatuh tempo 30 hari dan tercatat di laporan.
            </Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.detailTitle, { color: colors.text }]}>DETAIL TRANSAKSI</Text>
          <DetailRow label="Hari" value={DAY_NAMES[now.getDay()]} />
          <DetailRow label="Tanggal" value={String(now.getDate()).padStart(2, '0')} />
          <DetailRow label="Bulan" value={MONTH_NAMES[now.getMonth()]} />
          <DetailRow label="Tahun" value={String(now.getFullYear())} />
          <DetailRow label="Waktu" value={formatTime(now)} />
          <DetailRow label="Metode" value={method === 'cash' ? 'Tunai' : method === 'qris' ? 'QRIS' : 'Piutang'} />
          <View style={[styles.detailTotal, { borderTopColor: colors.border }]}>
            <Text style={[styles.detailTotalLabel, { color: colors.text }]}>Grand Total</Text>
            <Text style={[styles.detailTotalValue, { color: '#2E7D32' }]}>{formatRupiah(grandTotal)}</Text>
          </View>
          <Text style={[styles.dateNote, { color: colors.textMuted }]}>{formatDateLong(now)}</Text>
        </View>

        <PrimaryButton
          label={method === 'qris' ? 'KONFIRMASI LUNAS' : 'KONFIRMASI BAYAR'}
          height={46}
          onPress={() => void confirmPayment()}
          disabled={saving || items.length === 0 || (method === 'cash' && insufficient)}
          loading={saving}
        />
        {method === 'qris' ? (
          <SecondaryButton label="Batal" onPress={() => router.back()} style={{ marginTop: 8 }} />
        ) : null}
      </ScrollView>

      <Modal visible={customerModal} transparent animationType="slide" onRequestClose={() => setCustomerModal(false)} statusBarTranslucent>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Pilih Pelanggan</Text>
              <Pressable onPress={() => setCustomerModal(false)}>
                <Text style={[styles.close, { color: colors.textMuted }]}>Tutup</Text>
              </Pressable>
            </View>
            <TextInput
              value={customerSearch}
              onChangeText={setCustomerSearch}
              placeholder="Cari nama pelanggan..."
              placeholderTextColor={colors.textMuted}
              style={[styles.search, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
            />
            <ScrollView style={styles.customerList}>
              {customers
                .filter((item) => item.name.toLowerCase().includes(customerSearch.toLowerCase()))
                .map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setCustomer(item);
                      setCustomerModal(false);
                    }}
                    style={[styles.customerRow, { borderBottomColor: colors.border }]}
                  >
                    <Text style={[styles.customerName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.customerPhone, { color: colors.textMuted }]}>{item.phone ?? '-'}</Text>
                  </Pressable>
                ))}
            </ScrollView>
            <View style={[styles.newCustomer, { borderTopColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Pelanggan Baru</Text>
              <CustomTextField placeholder="Nama" value={newCustomerName} onChangeText={setNewCustomerName} />
              <CustomTextField placeholder="No. HP" value={newCustomerPhone} onChangeText={setNewCustomerPhone} keyboardType="phone-pad" />
              <PrimaryButton
                label="Tambah & Pilih"
                onPress={async () => {
                  if (!newCustomerName.trim()) {
                    showBanner('Nama pelanggan wajib diisi.', { type: 'error' });
                    return;
                  }
                  const created = await createCustomer({ name: newCustomerName, phone: newCustomerPhone });
                  setCustomers((list) => [...list, created]);
                  setCustomer(created);
                  setNewCustomerName('');
                  setNewCustomerPhone('');
                  setCustomerModal(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={successVisible}
        title="Pembayaran berhasil!"
        message="Transaksi tersimpan dan stok telah diperbarui."
        confirmLabel="Selesai"
        cancelLabel="Tutup"
        onConfirm={() => {
          setSuccessVisible(false);
          router.back();
        }}
        onCancel={() => {
          setSuccessVisible(false);
          router.back();
        }}
      />
      <LoadingOverlay visible={saving} label="Menyimpan transaksi..." />
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 78 },
  backText: { fontSize: 12, fontWeight: '800' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accent: { width: 16, height: 3, borderRadius: 2 },
  title: { fontSize: 17, fontWeight: '900' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  totalCard: { borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center', gap: 6 },
  totalLabel: { fontSize: 12, fontWeight: '700' },
  totalValue: { fontSize: 32, fontWeight: '900' },
  methodRow: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 3, gap: 3 },
  methodItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 8 },
  methodText: { fontSize: 12, fontWeight: '800' },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  cashBox: { borderWidth: 1.5, borderRadius: 10, padding: 12, gap: 4 },
  cashPrefix: { fontSize: 12, fontWeight: '700' },
  cashValue: { fontSize: 24, fontWeight: '900' },
  cashBig: { fontSize: 12, fontWeight: '800' },
  quickRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quick: { borderWidth: 1.2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  quickText: { fontSize: 11, fontWeight: '800' },
  keypad: { gap: 8 },
  keypadRow: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, height: sh(52), borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 18, fontWeight: '800' },
  qrWrapper: { alignItems: 'center' },
  qrImage: { width: ms(200), height: ms(200), borderRadius: 12 },
  qrPlaceholder: { width: ms(200), height: ms(140), borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 },
  qrHint: { fontSize: 11, textAlign: 'center' },
  helper: { fontSize: 11, lineHeight: 16 },
  customerBox: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 2 },
  customerName: { fontSize: 14, fontWeight: '800' },
  customerPhone: { fontSize: 11 },
  detailTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 11, fontWeight: '600' },
  detailValue: { fontSize: 11, fontWeight: '800' },
  detailTotal: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  detailTotalLabel: { fontSize: 13, fontWeight: '800' },
  detailTotalValue: { fontSize: 16, fontWeight: '900' },
  dateNote: { fontSize: 10, textAlign: 'right' },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '88%', gap: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 17, fontWeight: '900' },
  close: { fontSize: 13, fontWeight: '700' },
  search: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minHeight: 42 },
  customerList: { maxHeight: 200 },
  customerRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  newCustomer: { borderTopWidth: 1, paddingTop: 10, gap: 8 },
});
