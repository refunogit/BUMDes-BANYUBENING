import { all, first, run } from '@/data/database';
import { newId, nowIso } from '@/core/utils/id';

export type PlnCustomer = {
  id: string;
  idpel: string;
  name: string;
  daya: string | null;
  created_at: string;
  updated_at: string;
};

export async function listPlnCustomers(search = ''): Promise<PlnCustomer[]> {
  const q = `%${search.trim()}%`;
  return all<PlnCustomer>(
    `SELECT * FROM pln_customers WHERE (? = '' OR name LIKE ? OR idpel LIKE ?) ORDER BY name COLLATE NOCASE`,
    [search.trim(), q, q],
  );
}

export async function findPlnCustomer(idpel: string): Promise<PlnCustomer | null> {
  return first<PlnCustomer>('SELECT * FROM pln_customers WHERE idpel = ? LIMIT 1', [idpel.trim()]);
}

export async function savePlnCustomer(input: { idpel: string; name: string; daya: string }): Promise<PlnCustomer> {
  const existing = await findPlnCustomer(input.idpel);
  const now = nowIso();
  if (existing) {
    await run('UPDATE pln_customers SET name = ?, daya = ?, updated_at = ? WHERE id = ?', [
      input.name.trim(),
      input.daya.trim(),
      now,
      existing.id,
    ]);
    return { ...existing, name: input.name.trim(), daya: input.daya.trim(), updated_at: now };
  }
  const id = newId();
  await run(
    'INSERT INTO pln_customers (id, idpel, name, daya, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, input.idpel.trim(), input.name.trim(), input.daya.trim(), now, now],
  );
  return (await first<PlnCustomer>('SELECT * FROM pln_customers WHERE id = ?', [id]))!;
}
