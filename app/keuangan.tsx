import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card } from '@/shared/components/Card';
import { CustomTextField } from '@/shared/components/CustomTextField';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { DropdownField } from '@/shared/components/DropdownField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { AppIcon } from '@/shared/components/AppIcon';
import { useTheme } from '@/store/themeStore';
import {
  addCustomExpenseCategory,
  addExpense,
  deleteExpense,
  getBalanceSheet,
  getCashFlowStatement,
  getEquityStatement,
  getExpenseCategories,
  getExpenses,
  getIncomeStatement,
  type BalanceSheet,
  type CashFlowStatement,
  type EquityStatement,
  type Expense,
  type IncomeStatement,
} from '@/data/repositories/accountingRepository';
import { formatDate, toDateKey } from '@/core/utils/date';
import { formatRupiah } from '@/core/utils/currency';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';

export default function KeuanganScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const [income, setIncome] = useState<IncomeStatement | null>(null);
  const [balance, setBalance] = useState<BalanceSheet | null>(null);
  const [equity, setEquity] = useState<EquityStatement | null>(null);
  const [cashflow, setCashflow] = useState<CashFlowStatement | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('Beban Lain-lain');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const load = useCallback(async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const range = { from: monthStart, to: now.toISOString() };
    const [inc, bal, eq, cf, list, cats] = await Promise.all([
      getIncomeStatement(range),
      getBalanceSheet(),
      getEquityStatement(range),
      getCashFlowStatement(range),
      getExpenses(range),
      getExpenseCategories(),
    ]);
    setIncome(inc);
    setBalance(bal);
    setEquity(eq);
    setCashflow(cf);
    setExpenses(list);
    setCategories(cats);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveExpense = async () => {
    if (amount <= 0) {
      showBanner('Jumlah beban wajib lebih dari 0.', { type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await addExpense({ category, description, amount, expenseDate: toDateKey(new Date()) });
      hapticSuccess();
      showBanner('Beban dicatat.', { type: 'success' });
      setDescription('');
      setAmount(0);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <PageHeader title="Keuangan" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {income ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>LABA / RUGI — BULAN INI</Text>
            <Row label="Pendapatan" value={income.revenue} />
            <Row label="HPP" value={income.hpp} />
            <Row label="Laba Kotor" value={income.grossProfit} strong />
            <Row label="Keuntungan Listrik" value={income.listrikProfit} />
            <Row label="Keuntungan Pulsa/Data" value={income.pulsaProfit} />
            <Row label="Beban Operasional" value={income.expenses} />
            <Row label="Laba Bersih" value={income.netProfit} strong highlight={colors.success} />
          </Card>
        ) : null}

        {balance ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>NERACA</Text>
            <Row label="Kas" value={balance.cash} />
            <Row label="Piutang" value={balance.receivables} />
            <Row label="Persediaan" value={balance.inventory} />
            <Row label="Total Aset" value={balance.totalAssets} strong highlight={colors.primary} />
            <Row label="Kewajiban (Hutang)" value={balance.liabilities} />
            <Row label="Modal Awal" value={balance.initialCapital} />
            <Row label="Laba Ditahan" value={balance.retainedProfit} />
            <Row label="Total Ekuitas" value={balance.equity} strong />
            {Math.abs(balance.gap) > 0.5 ? <Row label="Penyesuaian" value={balance.gap} /> : null}
          </Card>
        ) : null}

        {equity ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>PERUBAHAN EKUITAS (LPE)</Text>
            <Row label="Ekuitas Awal" value={equity.openingEquity} />
            <Row label="Laba Bersih Periode" value={equity.netProfit} />
            <Row label="Prive" value={equity.prive} />
            <Row label="Ekuitas Akhir" value={equity.closingEquity} strong highlight={colors.primary} />
          </Card>
        ) : null}

        {cashflow ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>ARUS KAS (LAK)</Text>
            <Row label="Penerimaan Kas" value={cashflow.receipts} />
            <Row label="Pengeluaran Kas" value={cashflow.disbursements} />
            <Row label="Arus Kas Operasi" value={cashflow.operating} strong />
            <Row label="Investasi" value={cashflow.investing} />
            <Row label="Pendanaan" value={cashflow.financing} />
            <Row label="Kenaikan Kas Bersih" value={cashflow.netCash} strong highlight={colors.success} />
          </Card>
        ) : null}

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>TAMBAH BEBAN</Text>
          <DropdownField
            label="Kategori Beban"
            value={category}
            options={categories}
            onSelect={setCategory}
            onAddNew={async (value) => setCategories(await addCustomExpenseCategory(value))}
            addLabel="Tambah Kategori"
            modalTitle="Pilih Kategori Beban"
          />
          <CustomTextField label="Keterangan" value={description} onChangeText={setDescription} placeholder="Contoh: gaji kasir" />
          <CurrencyInput label="Jumlah" value={amount} onChange={setAmount} />
          <PrimaryButton label="Tambah Beban" onPress={() => void saveExpense()} loading={saving} />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>DAFTAR BEBAN — BULAN INI</Text>
          {expenses.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>Belum ada beban tercatat.</Text>
          ) : (
            expenses.map((expense) => (
              <View key={expense.id} style={[styles.expenseRow, { borderTopColor: colors.border }]}>
                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseCategory, { color: colors.text }]}>{expense.category}</Text>
                  <Text style={[styles.expenseMeta, { color: colors.textMuted }]}>
                    {expense.description || '-'} · {formatDate(expense.expense_date)}
                  </Text>
                </View>
                <Text style={[styles.expenseAmount, { color: colors.danger }]}>{formatRupiah(expense.amount)}</Text>
                <Pressable
                  onPress={() => setDeleteTarget(expense)}
                  accessibilityLabel="Hapus beban"
                >
                  <AppIcon name="produk_hapus" size={18} />
                </Pressable>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="Hapus Beban"
        message="Catatan beban ini akan dihapus permanen."
        confirmLabel="Hapus"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteExpense(deleteTarget.id);
          setDeleteTarget(null);
          await load();
        }}
      />
    </Screen>
  );
}

function Row({ label, value, strong, highlight }: { label: string; value: number; strong?: boolean; highlight?: string }): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textMuted, fontWeight: strong ? '800' : '600' }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: highlight ?? colors.text, fontSize: strong ? 14 : 12 }]}>{formatRupiah(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 12 },
  rowValue: { fontWeight: '800' },
  empty: { fontSize: 11 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  expenseInfo: { flex: 1, gap: 1 },
  expenseCategory: { fontSize: 12, fontWeight: '800' },
  expenseMeta: { fontSize: 10 },
  expenseAmount: { fontSize: 12, fontWeight: '800' },
});
