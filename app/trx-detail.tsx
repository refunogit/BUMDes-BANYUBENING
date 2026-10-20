import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { SecondaryButton } from '@/shared/components/SecondaryButton';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useTheme } from '@/store/themeStore';
import { getTransactionWithDetails, hardDeleteTransaction, type TransactionWithDetails } from '@/data/repositories/transactionRepository';
import { usePrintFlow } from '@/features/printer/usePrintFlow';
import { formatDateTime, formatTime } from '@/core/utils/date';
import { formatPlain, formatQuantity, formatRupiah } from '@/core/utils/currency';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';

export default function TrxDetailScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [trx, setTrx] = useState<TransactionWithDetails | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const { printTransactionById } = usePrintFlow();

  const load = useCallback(async () => {
    if (!id) return;
    setTrx(await getTransactionWithDetails(id));
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const methodLabel = trx?.payment_method === 'qris' ? 'QRIS' : trx?.payment_method === 'credit' ? 'Piutang' : 'Tunai';

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <PageHeader title="Riwayat Transaksi" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {trx ? (
          <>
            <Card style={styles.metaCard}>
              <View style={styles.metaHeader}>
                <Text style={[styles.invoice, { color: colors.text }]}>{trx.invoice_number}</Text>
                <Badge label={(trx.payment_method ?? 'cash').toUpperCase()} tone={trx.payment_method === 'qris' ? 'gold' : 'primary'} />
              </View>
              <Row label="Tanggal" value={formatDateTime(trx.created_at)} />
              <Row label="Pembayaran" value={methodLabel} />
              <Row label="Bayar" value={formatRupiah(trx.cash_amount)} />
              <Row label="Kembalian" value={formatRupiah(trx.change_amount)} />
              {trx.admin_fee > 0 ? <Row label="Admin" value={formatRupiah(trx.admin_fee)} /> : null}
              {trx.payment_reference ? <Row label="Ref" value={trx.payment_reference} /> : null}
              <Row label="Waktu" value={formatTime(trx.created_at)} />
            </Card>

            <Card style={styles.itemsCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>DAFTAR ITEM</Text>
              {trx.details.map((detail) => (
                <View key={detail.id} style={[styles.itemRow, { borderTopColor: colors.border }]}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                      {detail.name ?? 'Item'}
                    </Text>
                    <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                      {formatQuantity(detail.quantity)}x · {formatRupiah(detail.price)} · {detail.unit ?? ''}
                    </Text>
                  </View>
                  <Text style={[styles.itemSubtotal, { color: colors.primary }]}>{formatRupiah(detail.subtotal)}</Text>
                </View>
              ))}
              <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: '#2E7D32' }]}>{formatRupiah(trx.total)}</Text>
              </View>
              <Text style={[styles.qtyNote, { color: colors.textMuted }]}>
                {formatPlain(trx.details.reduce((sum, detail) => sum + detail.quantity, 0))} item
              </Text>
            </Card>

            <PrimaryButton label="Cetak Ulang" icon="printer_test" onPress={() => void printTransactionById(id)} />
            <SecondaryButton label="Hapus Transaksi" color={colors.danger} icon="produk_hapus" onPress={() => setDeleteVisible(true)} />
          </>
        ) : (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Memuat transaksi...</Text>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={deleteVisible}
        title="Hapus Transaksi"
        message="Transaksi akan dihapus permanen dan stok produk dikembalikan. Lanjutkan?"
        confirmLabel="Hapus"
        destructive
        onCancel={() => setDeleteVisible(false)}
        onConfirm={async () => {
          await hardDeleteTransaction(id);
          setDeleteVisible(false);
          hapticSuccess();
          showBanner('Transaksi dihapus dan stok dikembalikan.', { type: 'success' });
          router.back();
        }}
      />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  metaCard: { gap: 8 },
  metaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  invoice: { fontSize: 14, fontWeight: '900', flexShrink: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  metaLabel: { fontSize: 11, fontWeight: '600' },
  metaValue: { fontSize: 11, fontWeight: '800', textAlign: 'right', flexShrink: 1 },
  itemsCard: { gap: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 12, fontWeight: '700' },
  itemMeta: { fontSize: 10 },
  itemSubtotal: { fontSize: 12, fontWeight: '800' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 13, fontWeight: '800' },
  totalValue: { fontSize: 16, fontWeight: '900' },
  qtyNote: { fontSize: 10, textAlign: 'right' },
  empty: { fontSize: 12, textAlign: 'center', paddingVertical: 24 },
});
