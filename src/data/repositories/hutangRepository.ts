import { all, first, run } from '@/data/database';
import { newId, nowIso } from '@/core/utils/id';

export type Hutang = {
  id: string;
  nama: string;
  created_at: string;
  updated_at: string;
};

export type HutangItem = {
  id: string;
  hutang_id: string;
  tanggal: string | null;
  hari: string | null;
  transaksi: string | null;
  qty: number;
  harga: number;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type HutangSummary = Hutang & { total: number; item_count: number };

export async function listHutang(search = ''): Promise<HutangSummary[]> {
  const q = `%${search.trim()}%`;
  return all<HutangSummary>(
    `SELECT h.*, COALESCE(SUM(i.total), 0) as total, COUNT(i.id) as item_count
     FROM hutang h LEFT JOIN hutang_items i ON i.hutang_id = h.id
     WHERE (? = '' OR h.nama LIKE ?)
     GROUP BY h.id
     ORDER BY h.nama COLLATE NOCASE`,
    [search.trim(), q],
  );
}

export async function getHutangById(id: string): Promise<Hutang | null> {
  return first<Hutang>('SELECT * FROM hutang WHERE id = ?', [id]);
}

export async function findHutangByName(nama: string): Promise<Hutang | null> {
  return first<Hutang>('SELECT * FROM hutang WHERE lower(nama) = lower(?) LIMIT 1', [nama.trim()]);
}

/** Reuses an existing person's record instead of duplicating it. */
export async function ensureHutang(nama: string): Promise<Hutang> {
  const existing = await findHutangByName(nama);
  if (existing) return existing;
  const id = newId();
  const now = nowIso();
  await run('INSERT INTO hutang (id, nama, created_at, updated_at) VALUES (?, ?, ?, ?)', [id, nama.trim(), now, now]);
  return (await getHutangById(id))!;
}

export async function getHutangItems(hutangId: string): Promise<HutangItem[]> {
  return all<HutangItem>('SELECT * FROM hutang_items WHERE hutang_id = ? ORDER BY created_at DESC', [hutangId]);
}

export async function addHutangItem(input: {
  hutangId: string;
  tanggal: string;
  hari: string;
  transaksi: string;
  qty: number;
  harga: number;
  total: number;
  status?: string;
}): Promise<HutangItem> {
  const id = newId();
  const now = nowIso();
  await run(
    `INSERT INTO hutang_items (id, hutang_id, tanggal, hari, transaksi, qty, harga, total, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.hutangId,
      input.tanggal,
      input.hari,
      input.transaksi.trim(),
      input.qty,
      input.harga,
      input.total,
      input.status ?? 'hutang',
      now,
      now,
    ],
  );
  return (await first<HutangItem>('SELECT * FROM hutang_items WHERE id = ?', [id]))!;
}

export async function deleteHutangCascade(hutangId: string): Promise<void> {
  await run('DELETE FROM hutang_items WHERE hutang_id = ?', [hutangId]);
  await run('DELETE FROM hutang WHERE id = ?', [hutangId]);
}

export async function getHutangTotal(): Promise<number> {
  const row = await first<{ total: number | null }>('SELECT COALESCE(SUM(total), 0) as total FROM hutang_items');
  return Number(row?.total ?? 0);
}
