import { all, first, run } from '@/data/database';
import { newId, nowIso } from '@/core/utils/id';

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export async function listCustomers(search = ''): Promise<Customer[]> {
  const q = `%${search.trim()}%`;
  return all<Customer>(
    `SELECT * FROM customers WHERE (? = '' OR name LIKE ? OR COALESCE(phone, '') LIKE ?) ORDER BY name COLLATE NOCASE`,
    [search.trim(), q, q],
  );
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return first<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
}

export async function findCustomerByName(name: string): Promise<Customer | null> {
  return first<Customer>('SELECT * FROM customers WHERE lower(name) = lower(?) LIMIT 1', [name.trim()]);
}

export async function createCustomer(input: { name: string; phone?: string; address?: string }): Promise<Customer> {
  const id = newId();
  const now = nowIso();
  await run(
    'INSERT INTO customers (id, name, phone, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, input.name.trim(), input.phone?.trim() || null, input.address?.trim() || null, now, now],
  );
  return (await getCustomerById(id))!;
}

export async function updateCustomer(
  id: string,
  input: { name: string; phone?: string; address?: string },
): Promise<void> {
  await run('UPDATE customers SET name = ?, phone = ?, address = ?, updated_at = ? WHERE id = ?', [
    input.name.trim(),
    input.phone?.trim() || null,
    input.address?.trim() || null,
    nowIso(),
    id,
  ]);
}
