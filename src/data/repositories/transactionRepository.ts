/**
 * Transactions — atomic write (header + details + stock decrement + receivable).
 * Stock is only decremented when the transaction is saved as completed.
 */
import { getDatabase } from '@/data/database';
import { all, first } from '@/data/database';
import { newId, nowIso } from '@/core/utils/id';
import { addDays, toDateKey } from '@/core/utils/date';
import type { SqlParam } from '@/data/database';

export type PaymentMethod = 'cash' | 'qris' | 'credit';

export type TransactionItemInput = {
  productId: string | null;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  subtotal: number;
  costAmount?: number;
  serviceData?: unknown;
};

export type CreateTransactionInput = {
  total: number;
  paymentMethod: PaymentMethod;
  cashAmount: number;
  changeAmount: number;
  adminFee?: number;
  paymentReference?: string | null;
  userId: string | null;
  customerId: string | null;
  items: TransactionItemInput[];
};

export type Transaction = {
  id: string;
  invoice_number: string;
  total: number;
  payment_method: PaymentMethod;
  cash_amount: number;
  change_amount: number;
  admin_fee: number;
  payment_reference: string | null;
  status: 'completed' | 'void';
  user_id: string | null;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionDetail = {
  id: string;
  transaction_id: string;
  product_id: string | null;
  name: string | null;
  unit: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  cost_amount: number;
  service_data_json: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionWithDetails = Transaction & {
  details: TransactionDetail[];
  customer_name?: string | null;
};

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const db = await getDatabase();
  const id = newId();
  const invoice = `TRX-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  const now = nowIso();
  const status: Transaction['status'] = 'completed';

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO transactions
        (id, invoice_number, total, payment_method, cash_amount, change_amount, admin_fee, payment_reference, status, user_id, customer_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        invoice,
        input.total,
        input.paymentMethod,
        input.cashAmount,
        input.changeAmount,
        input.adminFee ?? 0,
        input.paymentReference ?? null,
        status,
        input.userId,
        input.customerId,
        now,
        now,
      ],
    );

    for (const item of input.items) {
      await db.runAsync(
        `INSERT INTO transaction_details
          (id, transaction_id, product_id, name, unit, quantity, price, subtotal, cost_amount, service_data_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(),
          id,
          item.productId ?? '',
          item.name,
          item.unit,
          item.quantity,
          item.price,
          item.subtotal,
          item.costAmount ?? 0,
          item.serviceData ? JSON.stringify(item.serviceData) : null,
          now,
          now,
        ],
      );
      if (item.productId) {
        await db.runAsync(
          'UPDATE products SET stock = MAX(0, stock - ?), updated_at = ? WHERE id = ?',
          [item.quantity, now, item.productId],
        );
      }
    }

    if (input.paymentMethod === 'credit' && input.customerId) {
      await db.runAsync(
        `INSERT INTO receivables
          (id, customer_id, transaction_id, total_amount, paid_amount, remaining_amount, due_date, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, 'unpaid', ?, ?)`,
        [newId(), input.customerId, id, input.total, input.total, toDateKey(addDays(new Date(), 30)), now, now],
      );
    }
  });

  const created = await getTransactionById(id);
  return created!;
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  return first<Transaction>('SELECT * FROM transactions WHERE id = ?', [id]);
}

export async function getTransactionWithDetails(id: string): Promise<TransactionWithDetails | null> {
  const trx = await getTransactionById(id);
  if (!trx) return null;
  const details = await all<TransactionDetail>(
    'SELECT * FROM transaction_details WHERE transaction_id = ? ORDER BY created_at ASC',
    [id],
  );
  const customer = trx.customer_id
    ? await first<{ name: string }>('SELECT name FROM customers WHERE id = ?', [trx.customer_id])
    : null;
  return { ...trx, details, customer_name: customer?.name ?? null };
}

export type TransactionFilter = {
  limit?: number;
  status?: 'completed' | 'void';
  from?: string;
  to?: string;
  paymentMethod?: PaymentMethod;
};

export async function listTransactions(filter: TransactionFilter = {}): Promise<Transaction[]> {
  const clauses: string[] = [];
  const params: SqlParam[] = [];
  if (filter.status) {
    clauses.push('status = ?');
    params.push(filter.status);
  }
  if (filter.from) {
    clauses.push('created_at >= ?');
    params.push(filter.from);
  }
  if (filter.to) {
    clauses.push('created_at <= ?');
    params.push(filter.to);
  }
  if (filter.paymentMethod) {
    clauses.push('payment_method = ?');
    params.push(filter.paymentMethod);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  params.push(filter.limit ?? 100);
  return all<Transaction>(
    `SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT ?`,
    params,
  );
}

export async function hardDeleteTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  const details = await all<TransactionDetail>('SELECT * FROM transaction_details WHERE transaction_id = ?', [id]);
  const now = nowIso();
  await db.withTransactionAsync(async () => {
    for (const detail of details) {
      if (detail.product_id) {
        await db.runAsync('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?', [
          detail.quantity,
          now,
          detail.product_id,
        ]);
      }
    }
    await db.runAsync('DELETE FROM transaction_details WHERE transaction_id = ?', [id]);
    await db.runAsync('DELETE FROM receivables WHERE transaction_id = ?', [id]);
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  });
}

export type SalesStats = {
  revenue: number;
  transactions: number;
  itemsSold: number;
};

export async function getSalesStats(from?: string, to?: string): Promise<SalesStats> {
  const params: SqlParam[] = [];
  const clauses = ["status = 'completed'"];
  if (from) {
    clauses.push('created_at >= ?');
    params.push(from);
  }
  if (to) {
    clauses.push('created_at <= ?');
    params.push(to);
  }
  const trx = await first<{ revenue: number | null; count: number }>(
    `SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as count FROM transactions WHERE ${clauses.join(' AND ')}`,
    params,
  );
  const items = await first<{ qty: number | null }>(
    `SELECT COALESCE(SUM(d.quantity), 0) as qty
     FROM transaction_details d
     JOIN transactions t ON t.id = d.transaction_id
     WHERE t.status = 'completed' ${from ? 'AND t.created_at >= ?' : ''} ${to ? 'AND t.created_at <= ?' : ''}`,
    params,
  );
  return {
    revenue: Number(trx?.revenue ?? 0),
    transactions: Number(trx?.count ?? 0),
    itemsSold: Number(items?.qty ?? 0),
  };
}

export type DailyPoint = { date: string; revenue: number; transactions: number };

export async function getDailySales(days = 7): Promise<DailyPoint[]> {
  const rows = await all<{ date: string; revenue: number; count: number }>(
    `SELECT substr(datetime(created_at, '+7 hours'), 1, 10) as date, COALESCE(SUM(total), 0) as revenue, COUNT(*) as count
     FROM transactions
     WHERE status = 'completed' AND substr(datetime(created_at, '+7 hours'), 1, 10) >= ?
     GROUP BY substr(datetime(created_at, '+7 hours'), 1, 10)
     ORDER BY date ASC`,
    [toDateKey(addDays(new Date(), -(days - 1)))],
  );
  const map = new Map(rows.map((r) => [r.date, r]));
  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const key = toDateKey(addDays(new Date(), -i));
    const row = map.get(key);
    points.push({ date: key, revenue: Number(row?.revenue ?? 0), transactions: Number(row?.count ?? 0) });
  }
  return points;
}

export async function getCategoryBreakdown(from?: string, to?: string): Promise<{ category: string; total: number }[]> {
  const params: SqlParam[] = [];
  const clauses = ["t.status = 'completed'"];
  if (from) {
    clauses.push('t.created_at >= ?');
    params.push(from);
  }
  if (to) {
    clauses.push('t.created_at <= ?');
    params.push(to);
  }
  return all<{ category: string; total: number }>(
    `SELECT COALESCE(NULLIF(p.category, ''), 'lainnya') as category, COALESCE(SUM(d.subtotal), 0) as total
     FROM transaction_details d
     JOIN transactions t ON t.id = d.transaction_id
     LEFT JOIN products p ON p.id = d.product_id
     WHERE ${clauses.join(' AND ')}
     GROUP BY category
     ORDER BY total DESC`,
    params,
  );
}

export async function countTodayTransactions(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return (await getSalesStats(start.toISOString(), end.toISOString())).transactions;
}

export type LedgerRow = { id: string; invoice_number: string; total: number; payment_method: PaymentMethod; created_at: string };

export async function getTransactionsSince(fromIso: string): Promise<LedgerRow[]> {
  return all<LedgerRow>(
    `SELECT id, invoice_number, total, payment_method, created_at FROM transactions
     WHERE status = 'completed' AND created_at >= ? ORDER BY created_at ASC`,
    [fromIso],
  );
}

export async function getWeeklySeries(weeks = 8): Promise<DailyPoint[]> {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - day);
  const start = new Date(monday);
  start.setDate(start.getDate() - (weeks - 1) * 7);
  const rows = await getTransactionsSince(start.toISOString());
  const buckets: DailyPoint[] = [];
  for (let index = 0; index < weeks; index += 1) {
    const bucketStart = new Date(start);
    bucketStart.setDate(bucketStart.getDate() + index * 7);
    const key = toDateKey(bucketStart);
    buckets.push({ date: key, revenue: 0, transactions: 0 });
  }
  for (const row of rows) {
    const created = new Date(row.created_at);
    const offset = Math.floor((created.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const bucket = buckets[offset];
    if (bucket) {
      bucket.revenue += row.total;
      bucket.transactions += 1;
    }
  }
  return buckets;
}

export async function getMonthlySeries(months = 12): Promise<DailyPoint[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const rows = await getTransactionsSince(start.toISOString());
  const buckets: DailyPoint[] = [];
  for (let index = 0; index < months; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1) + index, 1);
    buckets.push({ date: toDateKey(date), revenue: 0, transactions: 0 });
  }
  for (const row of rows) {
    const created = new Date(row.created_at);
    const bucket = buckets.find((item) => {
      const bucketDate = new Date(`${item.date}T00:00:00`);
      return bucketDate.getMonth() === created.getMonth() && bucketDate.getFullYear() === created.getFullYear();
    });
    if (bucket) {
      bucket.revenue += row.total;
      bucket.transactions += 1;
    }
  }
  return buckets;
}
