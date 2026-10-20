/**
 * Laporan — data bundle, PDF (expo-print) and CSV exports.
 * PDF/CSV berisi 5 section: Penjualan, Laba/Rugi, Neraca, LPE, LAK.
 * Kop laporan selalu dari app_settings (tanpa hardcode).
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';

import {
  getCategoryBreakdown,
  getDailySales,
  getMonthlySeries,
  getSalesStats,
  getWeeklySeries,
  listTransactions,
  type DailyPoint,
  type SalesStats,
  type Transaction,
} from '@/data/repositories/transactionRepository';
import {
  getBalanceSheet,
  getCashFlowStatement,
  getEquityStatement,
  getIncomeStatement,
  type BalanceSheet,
  type CashFlowStatement,
  type EquityStatement,
  type IncomeStatement,
} from '@/data/repositories/accountingRepository';
import { getTopProducts } from '@/data/repositories/productRepository';
import { listDueReceivables, type ReceivableWithCustomer } from '@/data/repositories/receivableRepository';
import { getSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { formatDate, formatDateLong, MONTH_SHORT, startOfDay } from '@/core/utils/date';
import { formatPlain } from '@/core/utils/currency';
import { toAsciiSafe } from '@/core/utils/string';
import { exportsDir } from '@/core/services/storageService';
import { hapticSuccess } from '@/core/utils/haptics';

export type ReportKind = 'harian' | 'mingguan' | 'bulanan';

export type ReportStore = {
  name: string;
  address: string;
  phone: string;
  logoDataUri: string | null;
};

export type ReportBundle = {
  kind: ReportKind;
  from: string;
  to: string;
  label: string;
  stats: SalesStats;
  income: IncomeStatement;
  balance: BalanceSheet;
  equity: EquityStatement;
  cashflow: CashFlowStatement;
  series: DailyPoint[];
  seriesLabels: string[];
  categories: { label: string; value: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  transactions: Transaction[];
  receivables: ReceivableWithCustomer[];
  store: ReportStore;
};

const PERIOD_LABEL: Record<ReportKind, string> = {
  harian: 'Hari Ini',
  mingguan: 'Minggu Ini',
  bulanan: 'Bulan Ini',
};

export function periodFor(kind: ReportKind): { from: string; to: string; label: string } {
  const now = new Date();
  if (kind === 'harian') {
    return { from: startOfDay(now).toISOString(), to: now.toISOString(), label: PERIOD_LABEL.harian };
  }
  if (kind === 'mingguan') {
    const day = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - day);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { from: monday.toISOString(), to: sunday.toISOString(), label: PERIOD_LABEL.mingguan };
  }
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: first.toISOString(), to: now.toISOString(), label: PERIOD_LABEL.bulanan };
}

function mimeFor(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/png';
}

export async function getReportStore(): Promise<ReportStore> {
  const name = (await getSetting(SETTINGS_KEYS.bumdesNama, 'BUMDes')) ?? 'BUMDes';
  const address = (await getSetting(SETTINGS_KEYS.strukAlamat)) ?? '';
  const phone = (await getSetting(SETTINGS_KEYS.strukTelp)) ?? '';
  const logo = await getSetting(SETTINGS_KEYS.bumdesLogo);
  let logoDataUri: string | null = null;
  if (logo) {
    try {
      const file = new File(logo);
      if (file.exists) logoDataUri = `data:${mimeFor(logo)};base64,${file.base64Sync()}`;
    } catch {
      logoDataUri = null;
    }
  }
  return { name, address, phone, logoDataUri };
}

export async function loadReport(kind: ReportKind): Promise<ReportBundle> {
  const period = periodFor(kind);
  const [stats, income, balance, equity, cashflow, categories, top, transactions, receivables, store] = await Promise.all([
    getSalesStats(period.from, period.to),
    getIncomeStatement({ from: period.from, to: period.to }),
    getBalanceSheet(),
    getEquityStatement({ from: period.from, to: period.to }),
    getCashFlowStatement({ from: period.from, to: period.to }),
    getCategoryBreakdown(period.from, period.to),
    getTopProducts(5),
    listTransactions({ status: 'completed', from: period.from, to: period.to, limit: 100 }),
    listDueReceivables(),
    getReportStore(),
  ]);

  const series = kind === 'harian' ? await getDailySales(7) : kind === 'mingguan' ? await getWeeklySeries(8) : await getMonthlySeries(12);
  const seriesLabels = series.map((point) => {
    const date = new Date(`${point.date}T00:00:00`);
    return kind === 'bulanan' ? `${MONTH_SHORT[date.getMonth()]} ${String(date.getFullYear()).slice(2)}` : `${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`;
  });

  const topCategories = categories.slice(0, 7);
  const rest = categories.slice(7).reduce((sum, row) => sum + row.total, 0);
  const pie = rest > 0 ? [...topCategories.map((row) => ({ label: row.category, value: row.total })), { label: 'Lainnya', value: rest }] : topCategories.map((row) => ({ label: row.category, value: row.total }));

  return {
    kind,
    from: period.from,
    to: period.to,
    label: period.label,
    stats,
    income,
    balance,
    equity,
    cashflow,
    series,
    seriesLabels,
    categories: pie,
    topProducts: top.map((row) => ({ name: row.name, qty: row.qty, revenue: row.revenue })),
    transactions,
    receivables,
    store,
  };
}

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function money(value: number): string {
  return `Rp ${formatPlain(Math.round(value))}`;
}

export function buildReportHtml(bundle: ReportBundle): string {
  const { store } = bundle;
  const logo = store.logoDataUri ? `<img src="${store.logoDataUri}" style="height:54px" />` : '';
  const rows = bundle.transactions
    .map(
      (trx, index) => `<tr><td>${index + 1}</td><td>${esc(trx.invoice_number)}</td><td>${formatDate(trx.created_at)}</td><td>${trx.payment_method.toUpperCase()}</td><td style="text-align:right">${money(trx.total)}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"/><style>
    @page { size: A4; margin: 14mm; }
    body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #1b2b3a; }
    .kop { display:flex; gap:14px; align-items:center; border-bottom:3px solid #0C3B6E; padding-bottom:10px; margin-bottom:14px; }
    h1 { font-size: 18px; color:#0C3B6E; margin:0; }
    h2 { font-size: 14px; color:#2F86D1; margin:18px 0 6px; border-left:4px solid #D8A93E; padding-left:8px; }
    table { width:100%; border-collapse: collapse; margin-top:6px; }
    th { background:#2F86D1; color:#fff; text-align:left; padding:5px; font-size:10px; }
    td { border-bottom:1px solid #DDE3EA; padding:4px; font-size:10px; }
    .kv td:first-child { width: 60%; color:#4a5b6c; }
    .kv td:last-child { text-align:right; font-weight:700; }
    .section { page-break-after: always; }
    .section:last-child { page-break-after: auto; }
    .muted { color:#7b8a99; font-size:9px; }
    .badge { display:inline-block; background:#0C3B6E; color:#fff; border-radius:9px; padding:2px 8px; font-size:9px; }
  </style></head><body>
  <div class="kop">${logo}<div><h1>${esc(store.name)}</h1><div>${esc(store.address)}</div><div>${esc(store.phone)}</div></div>
    <div style="margin-left:auto;text-align:right"><span class="badge">LAPORAN ${bundle.label.toUpperCase()}</span><div class="muted">${formatDateLong(bundle.from)} — ${formatDateLong(bundle.to)}</div></div>
  </div>

  <div class="section">
    <h2>1. Laporan Penjualan</h2>
    <table class="kv">
      <tr><td>Omzet ${esc(bundle.label)}</td><td>${money(bundle.stats.revenue)}</td></tr>
      <tr><td>Laba ${esc(bundle.label)}</td><td>${money(Math.max(0, bundle.income.netProfit))}</td></tr>
      <tr><td>Transaksi</td><td>${bundle.stats.transactions}</td></tr>
      <tr><td>Item Terjual</td><td>${formatPlain(bundle.stats.itemsSold)}</td></tr>
    </table>
    <h2>Barang Terlaris</h2>
    <table><thead><tr><th>Produk</th><th>Qty</th><th>Omzet</th></tr></thead><tbody>
      ${bundle.topProducts.map((item) => `<tr><td>${esc(item.name)}</td><td>${formatPlain(item.qty)}</td><td>${money(item.revenue)}</td></tr>`).join('')}
    </tbody></table>
    <h2>Riwayat Transaksi (maks 100)</h2>
    <table><thead><tr><th>#</th><th>Invoice</th><th>Tanggal</th><th>Metode</th><th>Total</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Belum ada transaksi.</td></tr>'}</tbody></table>
  </div>

  <div class="section">
    <h2>2. Laporan Laba/Rugi</h2>
    <table class="kv">
      <tr><td>Pendapatan</td><td>${money(bundle.income.revenue)}</td></tr>
      <tr><td>HPP</td><td>${money(bundle.income.hpp)}</td></tr>
      <tr><td>Laba Kotor</td><td>${money(bundle.income.grossProfit)}</td></tr>
      <tr><td>Keuntungan Listrik</td><td>${money(bundle.income.listrikProfit)}</td></tr>
      <tr><td>Keuntungan Pulsa/Data</td><td>${money(bundle.income.pulsaProfit)}</td></tr>
      <tr><td>Beban Operasional</td><td>${money(bundle.income.expenses)}</td></tr>
      <tr><td><strong>Laba Bersih</strong></td><td><strong>${money(bundle.income.netProfit)}</strong></td></tr>
    </table>
  </div>

  <div class="section">
    <h2>3. Neraca</h2>
    <table class="kv">
      <tr><td>Kas</td><td>${money(bundle.balance.cash)}</td></tr>
      <tr><td>Piutang</td><td>${money(bundle.balance.receivables)}</td></tr>
      <tr><td>Persediaan</td><td>${money(bundle.balance.inventory)}</td></tr>
      <tr><td><strong>Total Aset</strong></td><td><strong>${money(bundle.balance.totalAssets)}</strong></td></tr>
      <tr><td>Kewajiban (Hutang)</td><td>${money(bundle.balance.liabilities)}</td></tr>
      <tr><td>Modal Awal</td><td>${money(bundle.balance.initialCapital)}</td></tr>
      <tr><td>Laba Ditahan</td><td>${money(bundle.balance.retainedProfit)}</td></tr>
      <tr><td><strong>Total Ekuitas</strong></td><td><strong>${money(bundle.balance.equity)}</strong></td></tr>
      <tr><td>Total Kewajiban + Ekuitas</td><td>${money(bundle.balance.totalLiabilitiesEquity)}</td></tr>
      ${Math.abs(bundle.balance.gap) > 0.5 ? `<tr><td>Penyesuaian</td><td>${money(bundle.balance.gap)}</td></tr>` : ''}
    </table>
  </div>

  <div class="section">
    <h2>4. Laporan Perubahan Ekuitas (LPE)</h2>
    <table class="kv">
      <tr><td>Ekuitas Awal</td><td>${money(bundle.equity.openingEquity)}</td></tr>
      <tr><td>Laba Bersih Periode</td><td>${money(bundle.equity.netProfit)}</td></tr>
      <tr><td>Prive</td><td>${money(bundle.equity.prive)}</td></tr>
      <tr><td><strong>Ekuitas Akhir</strong></td><td><strong>${money(bundle.equity.closingEquity)}</strong></td></tr>
    </table>
  </div>

  <div class="section">
    <h2>5. Laporan Arus Kas (LAK)</h2>
    <table class="kv">
      <tr><td>Penerimaan Kas</td><td>${money(bundle.cashflow.receipts)}</td></tr>
      <tr><td>Pengeluaran Kas</td><td>${money(bundle.cashflow.disbursements)}</td></tr>
      <tr><td><strong>Arus Kas Operasi</strong></td><td><strong>${money(bundle.cashflow.operating)}</strong></td></tr>
      <tr><td>Aktivitas Investasi</td><td>${money(bundle.cashflow.investing)}</td></tr>
      <tr><td>Aktivitas Pendanaan</td><td>${money(bundle.cashflow.financing)}</td></tr>
      <tr><td><strong>Kenaikan Kas Bersih</strong></td><td><strong>${money(bundle.cashflow.netCash)}</strong></td></tr>
    </table>
    <p class="muted">Dicetak ${formatDateLong(new Date())} · KASIRKU</p>
  </div>
  </body></html>`;
}

export function buildReportCsv(bundle: ReportBundle): string {
  const lines: string[] = [];
  const push = (...cells: (string | number)[]) =>
    lines.push(cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  push('SECTION 1 - PENJUALAN');
  push('Metrik', 'Nilai');
  push('Omzet', bundle.stats.revenue);
  push('Laba', Math.max(0, bundle.income.netProfit));
  push('Transaksi', bundle.stats.transactions);
  push('Item Terjual', bundle.stats.itemsSold);
  push('');
  push('Invoice', 'Tanggal', 'Metode', 'Total');
  for (const trx of bundle.transactions) push(trx.invoice_number, formatDate(trx.created_at), trx.payment_method, trx.total);
  push('');
  push('SECTION 2 - LABA/RUGI');
  push('Pendapatan', bundle.income.revenue);
  push('HPP', bundle.income.hpp);
  push('Laba Kotor', bundle.income.grossProfit);
  push('Keuntungan Listrik', bundle.income.listrikProfit);
  push('Keuntungan Pulsa', bundle.income.pulsaProfit);
  push('Beban', bundle.income.expenses);
  push('Laba Bersih', bundle.income.netProfit);
  push('');
  push('SECTION 3 - NERACA');
  push('Kas', bundle.balance.cash);
  push('Piutang', bundle.balance.receivables);
  push('Persediaan', bundle.balance.inventory);
  push('Total Aset', bundle.balance.totalAssets);
  push('Kewajiban', bundle.balance.liabilities);
  push('Ekuitas', bundle.balance.equity);
  push('');
  push('SECTION 4 - LPE');
  push('Ekuitas Awal', bundle.equity.openingEquity);
  push('Laba Bersih', bundle.equity.netProfit);
  push('Prive', bundle.equity.prive);
  push('Ekuitas Akhir', bundle.equity.closingEquity);
  push('');
  push('SECTION 5 - LAK');
  push('Penerimaan Kas', bundle.cashflow.receipts);
  push('Pengeluaran Kas', bundle.cashflow.disbursements);
  push('Arus Kas Operasi', bundle.cashflow.operating);
  push('Investasi', bundle.cashflow.investing);
  push('Pendanaan', bundle.cashflow.financing);
  push('Kenaikan Kas Bersih', bundle.cashflow.netCash);
  return lines.join('\r\n');
}

export async function exportReportPdf(bundle: ReportBundle): Promise<string> {
  const html = buildReportHtml(bundle);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const target = new File(exportsDir(), `laporan_${Date.now()}.pdf`);
  if (target.exists) target.delete();
  new File(uri).copy(target);
  hapticSuccess();
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(target.uri, { mimeType: 'application/pdf', dialogTitle: 'Bagikan laporan PDF' });
  }
  return target.uri;
}

export async function exportReportCsv(bundle: ReportBundle): Promise<string> {
  const csv = buildReportCsv(bundle);
  const target = new File(exportsDir(), `laporan_${Date.now()}.csv`);
  if (target.exists) target.delete();
  target.create({ intermediates: true });
  target.write(toAsciiSafe(csv));
  hapticSuccess();
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(target.uri, { mimeType: 'text/csv', dialogTitle: 'Bagikan laporan CSV' });
  }
  return target.uri;
}
