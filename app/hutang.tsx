import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { PageHeader } from '@/shared/components/PageHeader';
import { AppIcon } from '@/shared/components/AppIcon';
import { Badge } from '@/shared/components/Badge';
import { CustomTextField } from '@/shared/components/CustomTextField';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { EmptyState } from '@/shared/components/EmptyState';
import { useTheme } from '@/store/themeStore';
import {
  addHutangItem,
  deleteHutangCascade,
  ensureHutang,
  getHutangItems,
  listHutang,
  type HutangItem,
  type HutangSummary,
} from '@/data/repositories/hutangRepository';
import { notifyHutangAdded, notifyHutangPaid } from '@/features/notifications/notificationService';
import { DAY_NAMES, formatDateLong, monthName } from '@/core/utils/date';
import { formatQuantity, formatRupiah, parseNumber } from '@/core/utils/currency';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';
import { ms } from '@/core/utils/scale';

type Status = 'hutang' | 'lunas';

export default function HutangScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const [rows, setRows] = useState<HutangSummary[]>([]);
  const [search, setSearch] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [detailItems, setDetailItems] = useState<HutangItem[]>([]);
  const [nama, setNama] = useState('');
  const [transaksi, setTransaksi] = useState('');
  const [qty, setQty] = useState('1');
  const [harga, setHarga] = useState(0);
  const [status, setStatus] = useState<Status>('hutang');
  const [nameLocked, setNameLocked] = useState(false);

  const load = useCallback(async () => {
    setRows(await listHutang(search));
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setNama('');
    setTransaksi('');
    setQty('1');
    setHarga(0);
    setStatus('hutang');
    setNameLocked(false);
    setFormVisible(true);
  };

  const openExisting = async (row: HutangSummary) => {
    setDetailItems(await getHutangItems(row.id));
    setNama(row.nama);
    setNameLocked(true);
    setTransaksi('');
    setQty('1');
    setHarga(0);
    setStatus('hutang');
    setFormVisible(true);
  };

  const saveItem = async () => {
    if (!nama.trim()) {
      showBanner('Nama wajib diisi.', { type: 'error' });
      return;
    }
    if (!transaksi.trim()) {
      showBanner('Transaksi wajib diisi.', { type: 'error' });
      return;
    }
    const quantity = parseNumber(qty);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      showBanner('Qty harus lebih dari 0.', { type: 'error' });
      return;
    }
    if (harga <= 0) {
      showBanner('Harga harus lebih dari 0.', { type: 'error' });
      return;
    }
    const now = new Date();
    const tanggal = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${monthName(now)} ${now.getFullYear()}`;
    const record = await ensureHutang(nama);
    await addHutangItem({
      hutangId: record.id,
      tanggal,
      hari: DAY_NAMES[now.getDay()],
      transaksi,
      qty: quantity,
      harga,
      total: Math.round(quantity * harga),
      status,
    });

    if (status === 'lunas') {
      await notifyHutangPaid(nama.trim());
      await deleteHutangCascade(record.id);
      showBanner(`Hutang atas nama ${nama.trim()} sudah lunas dan dihapus.`, { type: 'success' });
    } else {
      await notifyHutangAdded(nama.trim());
      showBanner('Hutang baru ditambahkan.', { type: 'success' });
    }
    hapticSuccess();
    setFormVisible(false);
    await load();
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <PageHeader title="Riwayat Hutang" onBack={() => router.back()} />
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppIcon name="hutang_list" size={16} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {rows.length === 0 ? (
          <EmptyState icon="hutang_list" title="Belum ada hutang" subtitle="Catat hutang pelanggan dengan tombol +." />
        ) : (
          rows.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => void openExisting(row)}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${colors.danger}18` }]}>
                <AppIcon name="hutang_list" size={24} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.name, { color: colors.text }]}>{row.nama}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>{row.item_count} item</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.total, { color: colors.danger }]}>{formatRupiah(row.total)}</Text>
                <Badge label="Hutang" tone="danger" />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={openNew}
        accessibilityRole="button"
        accessibilityLabel="Tambah hutang"
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.danger, borderColor: colors.gold, width: ms(60), height: ms(60), borderRadius: ms(60) / 2, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <AppIcon name="hutang_add" size={28} />
      </Pressable>

      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={() => setFormVisible(false)} statusBarTranslucent>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {nameLocked ? `Hutang ${nama}` : 'Catat Hutang'}
              </Text>
              <Pressable onPress={() => setFormVisible(false)} accessibilityRole="button">
                <Text style={[styles.close, { color: colors.textMuted }]}>Tutup</Text>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {detailItems.length > 0 ? (
                <View style={styles.existingItems}>
                  {detailItems.map((item) => (
                    <View key={item.id} style={[styles.itemRow, { borderTopColor: colors.border }]}>
                      <View style={styles.cardInfo}>
                        <Text style={[styles.itemName, { color: colors.text }]}>{item.transaksi}</Text>
                        <Text style={[styles.meta, { color: colors.textMuted }]}>
                          {formatQuantity(item.qty)} × {formatRupiah(item.harga)} · {item.tanggal}
                        </Text>
                      </View>
                      <Text style={[styles.itemTotal, { color: colors.danger }]}>{formatRupiah(item.total)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <CustomTextField
                label="Nama"
                required
                value={nama}
                onChangeText={setNama}
                editable={!nameLocked}
                placeholder="Nama pelanggan"
              />
              <CustomTextField label="Transaksi" required value={transaksi} onChangeText={setTransaksi} placeholder="Apa yang dibeli" />
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <CustomTextField label="Qty" value={qty} onChangeText={setQty} keyboardType="decimal-pad" />
                </View>
                <View style={styles.gridItem}>
                  <CurrencyInput label="Harga" value={harga} onChange={setHarga} />
                </View>
              </View>
              <View style={[styles.totalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.meta, { color: colors.textMuted }]}>Total otomatis</Text>
                <Text style={[styles.totalAuto, { color: colors.text }]}>{formatRupiah(Math.round((parseNumber(qty) || 0) * harga))}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>Tanggal: {formatDateLong(new Date())}</Text>
              </View>

              <Text style={[styles.statusLabel, { color: colors.text }]}>Status</Text>
              <View style={styles.statusRow}>
                {(['hutang', 'lunas'] as const).map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setStatus(value)}
                    style={[
                      styles.statusChip,
                      status === value
                        ? { backgroundColor: value === 'lunas' ? colors.success : colors.danger, borderColor: 'transparent' }
                        : { borderColor: colors.border },
                    ]}
                  >
                    <Text style={{ color: status === value ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 12 }}>
                      {value === 'hutang' ? 'Hutang' : 'Lunas'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {status === 'lunas' ? (
                <Text style={[styles.warning, { color: colors.danger }]}>
                  Menyimpan Lunas akan menghapus permanen seluruh catatan hutang atas nama ini.
                </Text>
              ) : null}

              <PrimaryButton label="Simpan" onPress={() => void saveItem()} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrapper: { paddingHorizontal: 16, paddingTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, minHeight: 44 },
  searchInput: { flex: 1, fontSize: 14 },
  content: { padding: 16, gap: 10, paddingBottom: 110 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '900' },
  meta: { fontSize: 10 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  total: { fontSize: 14, fontWeight: '900' },
  fab: { position: 'absolute', right: 18, bottom: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '90%', gap: 8 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 17, fontWeight: '900', flex: 1 },
  close: { fontSize: 13, fontWeight: '700' },
  existingItems: { marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  itemName: { fontSize: 12, fontWeight: '700' },
  itemTotal: { fontSize: 12, fontWeight: '800' },
  grid: { flexDirection: 'row', gap: 8 },
  gridItem: { flex: 1 },
  totalBox: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 2, marginVertical: 8 },
  totalAuto: { fontSize: 20, fontWeight: '900' },
  statusLabel: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statusChip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  warning: { fontSize: 11, marginBottom: 8, lineHeight: 16 },
});
