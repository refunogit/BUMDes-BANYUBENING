/**
 * SQLite bootstrap. Screens never touch this module directly — they call
 * Zustand stores, which call repositories, which use these helpers.
 */
import * as SQLite from 'expo-sqlite';

import { CREATE_TABLE_SQL, MIGRATION_SQL, TABLE_NAMES } from './schema';

export const DATABASE_NAME = 'bumdes.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function columnExists(db: SQLite.SQLiteDatabase, table: string, column: string): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((row) => row.name === column);
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await getDatabase();
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = OFF;');
  for (const sql of CREATE_TABLE_SQL) {
    await db.execAsync(sql);
  }
  for (const migration of MIGRATION_SQL) {
    const exists = await columnExists(db, migration.table, migration.column);
    if (!exists) await db.execAsync(migration.ddl);
  }
  return db;
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbPromise;
}

export async function closeDatabase(): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.closeAsync();
  dbPromise = null;
}

export type SqlParam = string | number | null;

export async function run(sql: string, params: SqlParam[] = []): Promise<SQLite.SQLiteRunResult> {
  const db = await getDatabase();
  return db.runAsync(sql, params);
}

export async function all<T>(sql: string, params: SqlParam[] = []): Promise<T[]> {
  const db = await getDatabase();
  return db.getAllAsync<T>(sql, params);
}

export async function first<T>(sql: string, params: SqlParam[] = []): Promise<T | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<T>(sql, params);
  return row ?? null;
}

export async function withTransaction<T>(work: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  const db = await getDatabase();
  let result!: T;
  await db.withTransactionAsync(async () => {
    result = await work(db);
  });
  return result;
}

/** Factory-reset helper: empties every known table. */
export async function truncateAllTables(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const table of [...TABLE_NAMES, 'sqlite_sequence'] as string[]) {
      if (table === 'sqlite_sequence') continue;
      await db.execAsync(`DELETE FROM ${table}`);
    }
  });
}

export async function removeDatabaseFile(): Promise<void> {
  try {
    await closeDatabase();
    await SQLite.deleteDatabaseAsync(DATABASE_NAME);
  } catch {
    // ignore: file may not exist yet
  }
}

export { TABLE_NAMES };
