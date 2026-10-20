import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card } from '@/shared/components/Card';
import { CustomTextField } from '@/shared/components/CustomTextField';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { SecondaryButton } from '@/shared/components/SecondaryButton';
import { AppIcon } from '@/shared/components/AppIcon';
import { useTheme } from '@/store/themeStore';
import {
  computeInvoiceTotals,
  emptyInvoiceItem,
  getInvoiceById,
  saveInvoice,
  shareInvoicePdf,
  type InvoiceItem,
  type InvoiceRecord,
} from '@/features/invoice/invoiceService';
import { formatRupiah, parseNumber } from '@/core/utils/currency';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';

export default function InvoiceEditorScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setInvoice(await getInvoiceById(id));
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (patch: Partial<InvoiceRecord>) => setInvoice((current) => (current ? { ...current, ...patch } : current));
  const updateItem = (itemId: string, patch: Partial<InvoiceItem>) =>
    setInvoice((current) =>
      current ? { ...current, items: current.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)) } : current,
    );

  const totals = invoice ? computeInvoiceTotals(invoice) : { subtotal: 0, itemDiscount: 0, tax: 0, total: 0, remaining: 0 };

  const save = async (thenPdf: boolean) => {
    if (!invoice) return;
    if (!invoice.customerName.trim()) {
      showBanner('Nama pelanggan wajib diisi.', { type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await saveInvoice(invoice);
      hapticSuccess();
      showBanner('Invoice disimpan.', { type: 'success' });
      if (thenPdf) await shareInvoicePdf(invoice);
    } catch {
      showBanner('Gagal menyimpan invoice.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <PageHeader title="Edit Invoice" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {invoice ? (
            <>
              <Card style={styles.section}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.reference, { color: colors.primary }]}>{invoice.reference}</Text>
                  <View style={styles.statusRow}>
                    <Text style={[styles.statusLabel, { color: colors.textMuted }]}>
                      {invoice.status === 'paid' ? 'Lunas' : 'Unpaid'}
                    </Text>
                    <Switch
                      value={invoice.status === 'paid'}
                      onValueChange={(value) => update({ status: value ? 'paid' : 'unpaid' })}
                      trackColor={{ false: colors.border, true: colors.success }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
                <CustomTextField label="Nama Pelanggan" required value={invoice.customerName} onChangeText={(value) => update({ customerName: value })} />
                <CustomTextField label="Alamat Pelanggan" value={invoice.customerAddress} onChangeText={(value) => update({ customerAddress: value })} />
                <CustomTextField label="No. HP Pelanggan" value={invoice.customerPhone} onChangeText={(value) => update({ customerPhone: value })} keyboardType="phone-pad" />
                <CustomTextField label="No. NPWP" value={invoice.npwp} onChangeText={(value) => update({ npwp: value })} />
              </Card>

              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>ITEM INVOICE</Text>
                {invoice.items.map((item, index) => (
                  <View key={item.id} style={[styles.itemBlock, { borderColor: colors.border }]}>
                    <View style={styles.rowBetween}>
                      <Text style={[styles.itemLabel, { color: colors.textMuted }]}>Item {index + 1}</Text>
                      <Pressable
                        onPress={() =>
                          setInvoice((current) =>
                            current ? { ...current, items: current.items.filter((row) => row.id !== item.id) } : current,
                          )
                        }
                        accessibilityRole="button"
                      >
                        <AppIcon name="produk_hapus" size={18} />
                      </Pressable>
                    </View>
                    <CustomTextField label="Deskripsi" value={item.description} onChangeText={(value) => updateItem(item.id, { description: value })} />
                    <View style={styles.grid}>
                      <View style={styles.gridItem}>
                        <CustomTextField
                          label="Qty"
                          value={String(item.quantity)}
                          keyboardType="decimal-pad"
                          onChangeText={(value) => updateItem(item.id, { quantity: parseNumber(value) || 0 })}
                        />
                      </View>
                      <View style={styles.gridItem}>
                        <CurrencyInput label="Harga" value={item.price} onChange={(value) => updateItem(item.id, { price: value })} />
                      </View>
                    </View>
                    <View style={styles.grid}>
                      <View style={styles.gridItem}>
                        <CurrencyInput label="Diskon" value={item.discount} onChange={(value) => updateItem(item.id, { discount: value })} />
                      </View>
                      <View style={styles.gridItem}>
                        <CustomTextField
                          label="Pajak (%)"
                          value={String(item.taxPercent)}
                          keyboardType="decimal-pad"
                          onChangeText={(value) => updateItem(item.id, { taxPercent: parseNumber(value) || 0 })}
                        />
                      </View>
                    </View>
                  </View>
                ))}
                <SecondaryButton
                  label="Tambah Item"
                  icon="produk_tambah"
                  onPress={() => setInvoice((current) => (current ? { ...current, items: [...current.items, emptyInvoiceItem()] } : current))}
                />
              </Card>

              <Card style={styles.section}>
                <CurrencyInput label="Additional Discount" value={invoice.additionalDiscount} onChange={(value) => update({ additionalDiscount: value })} />
                <CurrencyInput label="Total Terbayar" value={invoice.paidAmount} onChange={(value) => update({ paidAmount: value })} />
                <CustomTextField label="Keterangan" value={invoice.notes} onChangeText={(value) => update({ notes: value })} multiline />
                <CustomTextField label="Syarat & Ketentuan" value={invoice.terms} onChangeText={(value) => update({ terms: value })} multiline />
              </Card>

              <Card style={styles.section}>
                <SummaryRow label="Subtotal" value={formatRupiah(totals.subtotal)} />
                <SummaryRow label="Total Diskon" value={formatRupiah(totals.itemDiscount)} />
                <SummaryRow label="Pajak" value={formatRupiah(totals.tax)} />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <SummaryRow label="Total" value={formatRupiah(totals.total)} strong color={colors.primary} />
                <SummaryRow label="Sisa Tagihan" value={formatRupiah(totals.remaining)} strong color={colors.danger} />
              </Card>

              <PrimaryButton label="Simpan Invoice" onPress={() => void save(false)} loading={saving} />
              <SecondaryButton label="Simpan & Bagikan PDF" icon="laporan_pdf" onPress={() => void save(true)} />
            </>
          ) : (
            <Text style={[styles.loading, { color: colors.textMuted }]}>Memuat invoice...</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function SummaryRow({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.summaryRow}>
      <Text style={[{ color: colors.textMuted, fontSize: 12, fontWeight: strong ? '800' : '600' }, strong && { color: colors.text }]}>{label}</Text>
      <Text style={{ color: color ?? colors.text, fontSize: strong ? 15 : 12, fontWeight: strong ? '900' : '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { gap: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  reference: { fontSize: 16, fontWeight: '900' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  itemBlock: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 8 },
  itemLabel: { fontSize: 10, fontWeight: '800' },
  grid: { flexDirection: 'row', gap: 8 },
  gridItem: { flex: 1 },
  divider: { height: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loading: { fontSize: 12, textAlign: 'center', paddingVertical: 24 },
});
