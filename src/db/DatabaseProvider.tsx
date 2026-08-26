import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

const DB_NAME = 'benim-yerime-takip-et.db';

async function ensureColumn(db: SQLiteDatabase, table: string, column: string, definition: string) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function initDb(db: SQLiteDatabase) {
  await db.execAsync(CREATE_TABLES_SQL);
  // Var olan kurulumlarda eksikse yeni kolonları ekle (CREATE TABLE IF NOT EXISTS
  // zaten var olan tabloyu değiştirmez).
  await ensureColumn(db, 'people', 'reminderLeadMinutes', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'people', 'lateSuggestionDismissedAt', 'INTEGER');
  await ensureColumn(db, 'people', 'phone', 'TEXT');
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={initDb}>
      {children}
    </SQLiteProvider>
  );
}
