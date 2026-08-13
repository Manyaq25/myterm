import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

const DB_NAME = 'benim-yerime-takip-et.db';

async function initDb(db: SQLiteDatabase) {
  await db.execAsync(CREATE_TABLES_SQL);
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={initDb}>
      {children}
    </SQLiteProvider>
  );
}
