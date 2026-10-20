import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { PageHeader } from '@/shared/components/PageHeader';
import { AppIcon } from '@/shared/components/AppIcon';
import { Badge } from '@/shared/components/Badge';
import { EmptyState } from '@/shared/components/EmptyState';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useTheme } from '@/store/themeStore';
import {
  computeInvoiceTotals,
  createDraftInvoice,
  deleteInvoice,
  getInvoices,
  saveInvoice,
  shareInvoicePdf,
  type InvoiceRecord,
} from '@/features/invoice/invoiceService';
import { formatDate } from '@/core/utils/date';
import { formatRupiah } from '@/core/utils/currency';
import { showBanner } from '@/store/bannerStore';
import { ms } from '@/core/utils/scale';

export default function InvoiceListScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRecord | null>(null);

  const load = useCallback(async () => {
    setInvoices(await getInvoices());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <PageHeader title="Riwayat Invoice" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {invoices.length === 0 ? (
          <EmptyState icon="invoice_buat" title="Belum ada invoice" subtitle="Buat invoice pertama Anda." />
        ) : (
          invoices.map((invoice) => {
            const totals = computeInvoiceTotals(invoice);
            return (
              <Pressable
                key={invoice.id}
                onPress={() => router.push({ pathname: '/invoice-editor', params: { id: invoice.id } })}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.topRow}>
                  <Text style={[styles.reference, { color: colors.text }]}>{invoice.reference}</Text>
                  <Badge label={invoice.status === 'paid' ? 'Lunas' : 'Unpaid'} tone={invoice.status === 'paid' ? 'success' : 'danger'} />
                </View>
                <Text style={[styles.customer, { color: colors.textMuted }]}>
                  {invoice.customerName || 'Tanpa nama'} · {formatDate(invoice.date)}
                </Text>
                <View style={styles.bottomRow}>
                  <Text style={[styles.total, { color: colors.primary }]}>{formatRupiah(totals.total)}</Text>
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => void shareInvoicePdf(invoice)}
                      accessibilityRole="button"
                      style={styles.iconButton}
                    >
                      <AppIcon name="laporan_pdf" size={18} />
                    </Pressable>
                    <Pressable
                      onPress={() => setDeleteTarget(invoice)}
                      accessibilityRole="button"
                      style={styles.iconButton}
                    >
                      <AppIcon name="produk_hapus" size={18} />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Pressable
        onPress={async () => {
          const draft = await createDraftInvoice();
          await saveInvoice(draft);
          router.push({ pathname: '/invoice-editor', params: { id: draft.id } });
        }}
        accessibilityRole="button"
        accessibilityLabel="Buat invoice"
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, borderColor: colors.gold, width: ms(60), height: ms(60), borderRadius: ms(60) / 2, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <AppIcon name="invoice_buat" size={28} />
      </Pressable>

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="Hapus Invoice"
        message={`Invoice ${deleteTarget?.reference ?? ''} akan dihapus permanen.`}
        confirmLabel="Hapus"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteInvoice(deleteTarget.id);
          setDeleteTarget(null);
          showBanner('Invoice dihapus.', { type: 'success' });
          await load();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10, paddingBottom: 110 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reference: { fontSize: 13, fontWeight: '900' },
  customer: { fontSize: 11 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 15, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 8 },
  iconButton: { padding: 6 },
  fab: { position: 'absolute', right: 18, bottom: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center', elevation: 8 },
});
