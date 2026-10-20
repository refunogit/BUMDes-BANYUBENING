/**
 * Accounting — Neraca, Laba/Rugi, LPE, LAK (QA v8).
 * Revenue = completed transactions; HPP = cost_price * qty; electricity profit
 * = subtotal - cost_amount for service lines; expense table for operating costs.
 */
import { all, first, run } from '@/data/database';
import { newId, nowIso } from '@/core/utils/id';
import { getJsonSetting, setJsonSetting } from './settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { getReceivableTotal } from './receivableRepository';
import { getHutangTotal } from './hutangRepository';

export type IncomeStatement = {
  revenue: number;
  hpp: number;
  grossProfit: number;
  listrikProfit: number;
  pulsaProfit: number;
  expenses: number;
  netProfit: number;
};

export type Expense = {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string | null;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Beban Gaji & Upah',
  'Beban Listrik/Air/Telp',
  'Beban Sewa',
  'Beban Transportasi',
  'Beban Perlengkapan',
  'Beban Pemeliharaan',
  'Beban Pemasaran',
  'Beban Pajak & Retribusi',
  'Beban Penyusutan',
  'Beban Lain-lain',
] as const;

type Range = { from?: string; to?: string };

function rangeClause(alias: string, range: Range, params: (string | number)[]): string {
  const clauses = [`${alias}.status = 'completed'`];
  if (range.from) {
    clauses.push(`${alias}.created_at >= ?`);
    params.push(range.from);
  }
  if (range.to) {
    clauses.push(`${alias}.created_at <= ?`);
    params.push(range.to);
  }
  return clauses.join(' AND ');
}

export async function getIncomeStatement(range: Range = {}): Promise<IncomeStatement> {
  const params: (string | number)[] = [];
  const trxWhere = rangeClause('t', range, params);
  const revenueRow = await first<{ revenue: number | null }>(
    `SELECT COALESCE(SUM(t.total), 0) as revenue FROM transactions t WHERE ${trxWhere}`,
    params,
  );
  const hppRow = await first<{ hpp: number | null }>(
    `SELECT COALESCE(SUM(COALESCE(p.cost_price, 0) * d.quantity), 0) as hpp
     FROM transaction_details d
     JOIN transactions t ON t.id = d.transaction_id
     LEFT JOIN products p ON p.id = d.product_id
     WHERE ${trxWhere} AND d.product_id IS NOT NULL AND d.product_id <> ''`,
    params,
  );
  const listrikRow = await first<{ profit: number | null }>(
    `SELECT COALESCE(SUM(d.subtotal - d.cost_amount), 0) as profit
     FROM transaction_details d JOIN transactions t ON t.id = d.transaction_id
     WHERE ${trxWhere} AND d.cost_amount > 0 AND (d.product_id = '' OR d.product_id IS NULL)`,
    params,
  );
  const pulsaRow = await first<{ profit: number | null }>(
    `SELECT COALESCE(SUM(d.subtotal), 0) as profit
     FROM transaction_details d JOIN transactions t ON t.id = d.transaction_id
     WHERE ${trxWhere} AND d.cost_amount = 0 AND (d.product_id = '' OR d.product_id IS NULL)`,
    params,
  );
  const expenseParams: (string | number)[] = [];
  const expenseClauses: string[] = [];
  if (range.from) {
    expenseClauses.push('expense_date >= ?');
    expenseParams.push(range.from.slice(0, 10));
  }
  if (range.to) {
    expenseClauses.push('expense_date <= ?');
    expenseParams.push(range.to.slice(0, 10));
  }
  const expenseRow = await first<{ total: number | null }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM expenses ${expenseClauses.length ? `WHERE ${expenseClauses.join(' AND ')}` : ''}`,
    expenseParams,
  );

  const revenue = Number(revenueRow?.revenue ?? 0);
  const hpp = Number(hppRow?.hpp ?? 0);
  const grossProfit = revenue - hpp;
  const listrikProfit = Number(listrikRow?.profit ?? 0);
  const pulsaProfit = Number(pulsaRow?.profit ?? 0);
  const expenses = Number(expenseRow?.total ?? 0);
  return {
    revenue,
    hpp,
    grossProfit,
    listrikProfit,
    pulsaProfit,
    expenses,
    netProfit: grossProfit + listrikProfit + pulsaProfit - expenses,
  };
}

export async function getListrikProfit(range: Range = {}): Promise<number> {
  return (await getIncomeStatement(range)).listrikProfit;
}

export async function getPulsaProfit(range: Range = {}): Promise<number> {
  return (await getIncomeStatement(range)).pulsaProfit;
}

export type BalanceSheet = {
  cash: number;
  cashPhysical: number;
  cashQris: number;
  receivables: number;
  inventory: number;
  totalAssets: number;
  liabilities: number;
  initialCapital: number;
  retainedProfit: number;
  equity: number;
  totalLiabilitiesEquity: number;
  gap: number;
};

export async function getBalanceSheet(): Promise<BalanceSheet> {
  const cashRow = await first<{ cash: number | null; qris: number | null }>(
    `SELECT
       COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN cash_amount - change_amount ELSE 0 END), 0) as cash,
       COALESCE(SUM(CASE WHEN payment_method = 'qris' THEN total + admin_fee ELSE 0 END), 0) as qris
     FROM transactions WHERE status = 'completed'`,
  );
  const inventoryRow = await first<{ value: number | null }>(
    'SELECT COALESCE(SUM(cost_price * stock), 0) as value FROM products WHERE is_archived = 0',
  );
  const lastClose = await first<{ value: string | null }>(
    "SELECT value FROM app_settings WHERE key = ?",
    [SETTINGS_KEYS.lastCloseBookDate],
  );
  const retained = await getIncomeStatement(lastClose?.value ? { from: lastClose.value } : {});
  const initialCapitalRaw = await first<{ value: string | null }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [SETTINGS_KEYS.initialCapital],
  );
  const initialCapital = Number(initialCapitalRaw?.value ?? 0) || 0;
  const cashPhysical = Number(cashRow?.cash ?? 0);
  const cashQris = Number(cashRow?.qris ?? 0);
  const cash = cashPhysical + cashQris;
  const receivables = await getReceivableTotal();
  const inventory = Number(inventoryRow?.value ?? 0);
  const totalAssets = cash + receivables + inventory;
  const liabilities = await getHutangTotal();
  const equity = initialCapital + retained.netProfit;
  const totalLiabilitiesEquity = liabilities + equity;
  return {
    cash,
    cashPhysical,
    cashQris,
    receivables,
    inventory,
    totalAssets,
    liabilities,
    initialCapital,
    retainedProfit: retained.netProfit,
    equity,
    totalLiabilitiesEquity,
    gap: totalAssets - totalLiabilitiesEquity,
  };
}

export type EquityStatement = {
  openingEquity: number;
  netProfit: number;
  prive: number;
  closingEquity: number;
};

export async function getEquityStatement(range: Range = {}): Promise<EquityStatement> {
  const initialRaw = await first<{ value: string | null }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [SETTINGS_KEYS.initialCapital],
  );
  const initialCapital = Number(initialRaw?.value ?? 0) || 0;
  const before = range.from ? await getIncomeStatement({ to: range.from }) : { netProfit: 0 };
  const current = await getIncomeStatement(range);
  const openingEquity = initialCapital + before.netProfit;
  const prive = 0;
  return {
    openingEquity,
    netProfit: current.netProfit,
    prive,
    closingEquity: openingEquity + current.netProfit - prive,
  };
}

export type CashFlowStatement = {
  receipts: number;
  disbursements: number;
  operating: number;
  investing: number;
  financing: number;
  netCash: number;
};

export async function getCashFlowStatement(range: Range = {}): Promise<CashFlowStatement> {
  const params: (string | number)[] = [];
  const clauses = ["status = 'completed'"];
  if (range.from) {
    clauses.push('created_at >= ?');
    params.push(range.from);
  }
  if (range.to) {
    clauses.push('created_at <= ?');
    params.push(range.to);
  }
  const row = await first<{ receipts: number | null }>(
    `SELECT COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN cash_amount - change_amount
                              WHEN payment_method = 'qris' THEN total + admin_fee ELSE 0 END), 0) as receipts
     FROM transactions WHERE ${clauses.join(' AND ')}`,
    params,
  );
  const expenseParams: (string | number)[] = [];
  const expenseClauses: string[] = [];
  if (range.from) {
    expenseClauses.push('expense_date >= ?');
    expenseParams.push(range.from.slice(0, 10));
  }
  if (range.to) {
    expenseClauses.push('expense_date <= ?');
    expenseParams.push(range.to.slice(0, 10));
  }
  const expRow = await first<{ total: number | null }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM expenses ${expenseClauses.length ? `WHERE ${expenseClauses.join(' AND ')}` : ''}`,
    expenseParams,
  );
  const receipts = Number(row?.receipts ?? 0);
  const disbursements = Number(expRow?.total ?? 0);
  const operating = receipts - disbursements;
  return { receipts, disbursements, operating, investing: 0, financing: 0, netCash: operating };
}

export async function getExpenseCategories(): Promise<string[]> {
  const custom = await getJsonSetting<string[]>(SETTINGS_KEYS.customExpenseCategories, []);
  return Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...custom].map((c) => c.trim()).filter(Boolean)));
}

export async function addCustomExpenseCategory(name: string): Promise<string[]> {
  const clean = name.trim();
  const current = await getJsonSetting<string[]>(SETTINGS_KEYS.customExpenseCategories, []);
  if (clean && ![...DEFAULT_EXPENSE_CATEGORIES, ...current].some((c) => c.toLowerCase() === clean.toLowerCase())) {
    current.push(clean);
    await setJsonSetting(SETTINGS_KEYS.customExpenseCategories, current);
  }
  return getExpenseCategories();
}

export async function addExpense(input: {
  category: string;
  description?: string;
  amount: number;
  expenseDate: string;
}): Promise<Expense> {
  const id = newId();
  const now = nowIso();
  await run(
    `INSERT INTO expenses (id, category, description, amount, expense_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.category, input.description?.trim() || null, input.amount, input.expenseDate, now, now],
  );
  return (await first<Expense>('SELECT * FROM expenses WHERE id = ?', [id]))!;
}

export async function getExpenses(range: Range = {}): Promise<Expense[]> {
  const params: (string | number)[] = [];
  const clauses: string[] = [];
  if (range.from) {
    clauses.push('expense_date >= ?');
    params.push(range.from.slice(0, 10));
  }
  if (range.to) {
    clauses.push('expense_date <= ?');
    params.push(range.to.slice(0, 10));
  }
  return all<Expense>(
    `SELECT * FROM expenses ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''} ORDER BY expense_date DESC, created_at DESC`,
    params,
  );
}

export async function deleteExpense(id: string): Promise<void> {
  await run('DELETE FROM expenses WHERE id = ?', [id]);
}

export type ClosingLog = {
  id: string;
  closing_date: string;
  gross_profit: number;
  net_profit: number;
  total_expenses: number;
  total_revenue: number;
};

export async function logBookClosing(input: {
  closingDate: string;
  grossProfit: number;
  netProfit: number;
  totalExpenses: number;
  totalRevenue: number;
}): Promise<void> {
  const now = nowIso();
  await run(
    `INSERT INTO book_closing_log (id, closing_date, gross_profit, net_profit, total_expenses, total_revenue, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [newId(), input.closingDate, input.grossProfit, input.netProfit, input.totalExpenses, input.totalRevenue, now, now],
  );
}

export async function getClosingLogs(limit = 24): Promise<ClosingLog[]> {
  return all<ClosingLog>('SELECT * FROM book_closing_log ORDER BY closing_date DESC LIMIT ?', [limit]);
}

export async function getDashboardProfit(): Promise<{ gross: number; net: number }> {
  const lastClose = await first<{ value: string | null }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [SETTINGS_KEYS.lastCloseBookDate],
  );
  const range: Range = lastClose?.value ? { from: lastClose.value } : {};
  const params: (string | number)[] = [];
  const trxWhere = rangeClause('t', range, params);
  const grossRow = await first<{ gross: number | null }>(
    `SELECT COALESCE(SUM(t.total), 0) as gross FROM transactions t WHERE ${trxWhere}`,
    params,
  );
  const netRow = await first<{ net: number | null }>(
    `SELECT COALESCE(SUM((d.price - COALESCE(p.cost_price, 0)) * d.quantity), 0) as net
     FROM transaction_details d JOIN transactions t ON t.id = d.transaction_id
     LEFT JOIN products p ON p.id = d.product_id
     WHERE ${trxWhere}`,
    params,
  );
  return { gross: Number(grossRow?.gross ?? 0), net: Number(netRow?.net ?? 0) };
}
