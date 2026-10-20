/**
 * SQLite schema — 13 core tables + 2 accounting tables.
 * Rules: every table has UUID `id`, `created_at`, `updated_at`; NO foreign keys;
 * all access goes through repositories with parameterized queries.
 */
export const TABLE_NAMES = [
  'users',
  'app_settings',
  'business_units',
  'products',
  'customers',
  'transactions',
  'transaction_details',
  'shifts',
  'receivables',
  'held_carts',
  'pln_customers',
  'hutang',
  'hutang_items',
  'expenses',
  'book_closing_log',
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

const audit = `
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
`;

export const CREATE_TABLE_SQL: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT NOT NULL UNIQUE,
    pin_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    display_name TEXT,
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT NOT NULL,
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT,
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS business_units (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT,
    type TEXT,
    address TEXT,
    phone TEXT,
    logo_path TEXT,
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    barcode TEXT,
    price REAL NOT NULL DEFAULT 0,
    cost_price REAL NOT NULL DEFAULT 0,
    stock REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'pcs',
    category TEXT NOT NULL DEFAULT 'lainnya',
    image_path TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0,
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    total REAL NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    cash_amount REAL NOT NULL DEFAULT 0,
    change_amount REAL NOT NULL DEFAULT 0,
    admin_fee REAL NOT NULL DEFAULT 0,
    payment_reference TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    user_id TEXT,
    customer_id TEXT,
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS transaction_details (
    id TEXT PRIMARY KEY NOT NULL,
    transaction_id TEXT NOT NULL,
    product_id TEXT,
    name TEXT,
    unit TEXT,
    quantity REAL NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0,
    subtotal REAL NOT NULL DEFAULT 0,
    cost_amount REAL NOT NULL DEFAULT 0,
    service_data_json TEXT,
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT,
    open_time TEXT,
    close_time TEXT,
    opening_balance REAL NOT NULL DEFAULT 0,
    closing_balance REAL NOT NULL DEFAULT 0,
    total_cash REAL NOT NULL DEFAULT 0,
    total_qris REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open',
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS receivables (
    id TEXT PRIMARY KEY NOT NULL,
    customer_id TEXT,
    transaction_id TEXT,
    total_amount REAL NOT NULL DEFAULT 0,
    paid_amount REAL NOT NULL DEFAULT 0,
    remaining_amount REAL NOT NULL DEFAULT 0,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'unpaid',
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS held_carts (
    id TEXT PRIMARY KEY NOT NULL,
    cart_data_json TEXT NOT NULL,
    held_at TEXT,
    notes TEXT,
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS pln_customers (
    id TEXT PRIMARY KEY NOT NULL,
    idpel TEXT NOT NULL,
    name TEXT NOT NULL,
    daya TEXT,
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS hutang (
    id TEXT PRIMARY KEY NOT NULL,
    nama TEXT NOT NULL,
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS hutang_items (
    id TEXT PRIMARY KEY NOT NULL,
    hutang_id TEXT NOT NULL,
    tanggal TEXT,
    hari TEXT,
    transaksi TEXT,
    qty REAL NOT NULL DEFAULT 0,
    harga REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'hutang',
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL DEFAULT 0,
    expense_date TEXT,
    ${audit}
  );`,

  `CREATE TABLE IF NOT EXISTS book_closing_log (
    id TEXT PRIMARY KEY NOT NULL,
    closing_date TEXT NOT NULL,
    gross_profit REAL NOT NULL DEFAULT 0,
    net_profit REAL NOT NULL DEFAULT 0,
    total_expenses REAL NOT NULL DEFAULT 0,
    total_revenue REAL NOT NULL DEFAULT 0,
    ${audit}
  );`,

  `CREATE INDEX IF NOT EXISTS idx_products_archived ON products(is_archived);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);`,
  `CREATE INDEX IF NOT EXISTS idx_details_transaction ON transaction_details(transaction_id);`,
  `CREATE INDEX IF NOT EXISTS idx_hutang_items_parent ON hutang_items(hutang_id);`,
  `CREATE INDEX IF NOT EXISTS idx_receivables_status ON receivables(status);`,
];

/** Idempotent ALTERs for databases created by earlier versions. */
export const MIGRATION_SQL: { table: string; column: string; ddl: string }[] = [
  { table: 'transactions', column: 'admin_fee', ddl: 'ALTER TABLE transactions ADD COLUMN admin_fee REAL NOT NULL DEFAULT 0' },
  { table: 'transactions', column: 'payment_reference', ddl: 'ALTER TABLE transactions ADD COLUMN payment_reference TEXT' },
  { table: 'transaction_details', column: 'cost_amount', ddl: 'ALTER TABLE transaction_details ADD COLUMN cost_amount REAL NOT NULL DEFAULT 0' },
  { table: 'transaction_details', column: 'service_data_json', ddl: 'ALTER TABLE transaction_details ADD COLUMN service_data_json TEXT' },
  { table: 'transaction_details', column: 'name', ddl: 'ALTER TABLE transaction_details ADD COLUMN name TEXT' },
  { table: 'transaction_details', column: 'unit', ddl: 'ALTER TABLE transaction_details ADD COLUMN unit TEXT' },
  { table: 'hutang_items', column: 'status', ddl: "ALTER TABLE hutang_items ADD COLUMN status TEXT NOT NULL DEFAULT 'hutang'" },
];
