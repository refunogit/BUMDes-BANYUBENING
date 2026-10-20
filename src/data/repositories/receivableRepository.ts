import { all, first, run } from '@/data/database';
import { nowIso } from '@/core/utils/id';

export type Receivable = {
  id: string;
  customer_id: string | null;
  transaction_id: string | null;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ReceivableWithCustomer = Receivable & { customer_name: string | null; customer_phone: string | null };

export async function listReceivables(status?: string): Promise<ReceivableWithCustomer[]> {
  const params: string[] = [];
  const where = status ? 'WHERE r.status = ?' : '';
  if (status) params.push(status);
  return all<ReceivableWithCustomer>(
    `SELECT r.*, c.name as customer_name, c.phone as customer_phone
     FROM receivables r LEFT JOIN customers c ON c.id = r.customer_id
     ${where}
     ORDER BY r.created_at DESC`,
    params,
  );
}

export async function listDueReceivables(): Promise<ReceivableWithCustomer[]> {
  return all<ReceivableWithCustomer>(
    `SELECT r.*, c.name as customer_name, c.phone as customer_phone
     FROM receivables r LEFT JOIN customers c ON c.id = r.customer_id
     WHERE r.status <> 'paid' AND r.due_date IS NOT NULL AND r.due_date <= date('now', '+7 hours')
     ORDER BY r.due_date ASC`,
  );
}

export async function markReceivablePaid(id: string): Promise<void> {
  await run(
    `UPDATE receivables SET paid_amount = total_amount, remaining_amount = 0, status = 'paid', updated_at = ? WHERE id = ?`,
    [nowIso(), id],
  );
}

export async function getReceivableTotal(): Promise<number> {
  const row = await first<{ total: number | null }>(
    "SELECT COALESCE(SUM(remaining_amount), 0) as total FROM receivables WHERE status <> 'paid'",
  );
  return Number(row?.total ?? 0);
}
