import { all, first, run } from '@/data/database';
import { getJsonSetting, setJsonSetting } from './settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { newId, nowIso } from '@/core/utils/id';
import { deleteFileSafe } from '@/core/services/storageService';

export type Product = {
  id: string;
  name: string;
  barcode: string | null;
  price: number;
  cost_price: number;
  stock: number;
  unit: string;
  category: string;
  image_path: string | null;
  is_archived: number;
  created_at: string;
  updated_at: string;
};

export type ProductInput = {
  name: string;
  barcode?: string | null;
  price: number;
  cost_price?: number;
  stock?: number;
  unit: string;
  category: string;
  image_path?: string | null;
};

export const DEFAULT_UNITS = [
  'lembar', 'keping', 'pcs', 'kg', 'liter', 'meter', 'box', 'pack', 'sak', 'ekor', 'ikat',
] as const;

export const DEFAULT_CATEGORIES = [
  'penggandaan/cetak dokumen',
  'jasa cetak',
  'alat tulis',
  'sembako',
  'minuman',
  'makanan',
  'rokok',
  'kebutuhan rumah tangga',
  'kosmetik',
  'lainnya',
] as const;

export async function listProducts(options?: {
  search?: string;
  category?: string;
  includeArchived?: boolean;
  limit?: number;
}): Promise<Product[]> {
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (!options?.includeArchived) clauses.push('is_archived = 0');
  if (options?.search?.trim()) {
    clauses.push('(name LIKE ? OR COALESCE(barcode, \'\') LIKE ?)');
    const q = `%${options.search.trim()}%`;
    params.push(q, q);
  }
  if (options?.category && options.category !== 'Semua') {
    clauses.push('category = ?');
    params.push(options.category);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = options?.limit ? `LIMIT ${Math.max(1, Math.floor(options.limit))}` : '';
  return all<Product>(`SELECT * FROM products ${where} ORDER BY name COLLATE NOCASE ASC ${limit}`, params);
}

export async function getProductById(id: string): Promise<Product | null> {
  return first<Product>('SELECT * FROM products WHERE id = ?', [id]);
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  return first<Product>('SELECT * FROM products WHERE barcode = ? AND is_archived = 0 LIMIT 1', [barcode.trim()]);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const id = newId();
  const now = nowIso();
  await run(
    `INSERT INTO products (id, name, barcode, price, cost_price, stock, unit, category, image_path, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      id,
      input.name.trim(),
      input.barcode?.trim() || null,
      input.price,
      input.cost_price ?? 0,
      input.stock ?? 0,
      input.unit,
      input.category,
      input.image_path ?? null,
      now,
      now,
    ],
  );
  return (await getProductById(id))!;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product | null> {
  await run(
    `UPDATE products SET name = ?, barcode = ?, price = ?, cost_price = ?, unit = ?, category = ?, image_path = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.name.trim(),
      input.barcode?.trim() || null,
      input.price,
      input.cost_price ?? 0,
      input.unit,
      input.category,
      input.image_path ?? null,
      nowIso(),
      id,
    ],
  );
  return getProductById(id);
}

/** Soft delete: archived products disappear from lists but data stays. */
export async function archiveProduct(id: string): Promise<void> {
  await run('UPDATE products SET is_archived = 1, updated_at = ? WHERE id = ?', [nowIso(), id]);
}

export async function adjustStock(id: string, delta: number): Promise<void> {
  await run('UPDATE products SET stock = MAX(0, stock + ?), updated_at = ? WHERE id = ?', [delta, nowIso(), id]);
}

export async function getCategories(): Promise<string[]> {
  const rows = await all<{ category: string }>(
    "SELECT DISTINCT category FROM products WHERE is_archived = 0 AND category IS NOT NULL AND category <> '' ORDER BY category COLLATE NOCASE",
  );
  return rows.map((r) => r.category);
}

export async function getCategoriesAll(): Promise<string[]> {
  const custom = await getJsonSetting<string[]>(SETTINGS_KEYS.customCategories, []);
  const merged = [...DEFAULT_CATEGORIES, ...custom];
  return Array.from(new Set(merged.map((c) => c.trim()).filter(Boolean)));
}

export async function addCustomCategory(name: string): Promise<string[]> {
  const clean = name.trim();
  const current = await getJsonSetting<string[]>(SETTINGS_KEYS.customCategories, []);
  if (clean && ![...DEFAULT_CATEGORIES, ...current].some((c) => c.toLowerCase() === clean.toLowerCase())) {
    current.push(clean);
    await setJsonSetting(SETTINGS_KEYS.customCategories, current);
  }
  return getCategoriesAll();
}

export async function getUnitsAll(): Promise<string[]> {
  const custom = await getJsonSetting<string[]>(SETTINGS_KEYS.customUnits, []);
  return Array.from(new Set([...DEFAULT_UNITS, ...custom].map((u) => u.trim()).filter(Boolean)));
}

export async function addCustomUnit(name: string): Promise<string[]> {
  const clean = name.trim();
  const current = await getJsonSetting<string[]>(SETTINGS_KEYS.customUnits, []);
  if (clean && ![...DEFAULT_UNITS, ...current].some((u) => u.toLowerCase() === clean.toLowerCase())) {
    current.push(clean);
    await setJsonSetting(SETTINGS_KEYS.customUnits, current);
  }
  return getUnitsAll();
}

export type LowStockProduct = Pick<Product, 'id' | 'name' | 'stock' | 'unit'>;

export async function getLowStockProducts(limit = 6): Promise<LowStockProduct[]> {
  return all<LowStockProduct>(
    'SELECT id, name, stock, unit FROM products WHERE stock < 2 AND is_archived = 0 ORDER BY stock ASC, name ASC LIMIT ?',
    [limit],
  );
}

export async function getAvailableProducts(limit = 6): Promise<Product[]> {
  return all<Product>(
    'SELECT * FROM products WHERE is_archived = 0 AND stock > 0 ORDER BY created_at DESC LIMIT ?',
    [limit],
  );
}

export async function getTopProducts(limit = 5): Promise<{ product_id: string; name: string; qty: number; revenue: number }[]> {
  return all<{ product_id: string; name: string; qty: number; revenue: number }>(
    `SELECT d.product_id as product_id, COALESCE(p.name, d.name, 'Produk') as name,
            SUM(d.quantity) as qty, SUM(d.subtotal) as revenue
     FROM transaction_details d
     JOIN transactions t ON t.id = d.transaction_id AND t.status = 'completed'
     LEFT JOIN products p ON p.id = d.product_id
     WHERE d.product_id IS NOT NULL AND d.product_id <> ''
     GROUP BY d.product_id
     ORDER BY qty DESC
     LIMIT ?`,
    [limit],
  );
}

export async function getTopStockProducts(limit = 20): Promise<Product[]> {
  return all<Product>(
    'SELECT * FROM products WHERE is_archived = 0 ORDER BY stock DESC LIMIT ?',
    [limit],
  );
}

export async function saveProductImage(oldPath: string | null | undefined, newPath: string | null): Promise<void> {
  if (oldPath && oldPath !== newPath) deleteFileSafe(oldPath);
}

export async function deleteProductWithImage(product: Product): Promise<void> {
  await archiveProduct(product.id);
}
