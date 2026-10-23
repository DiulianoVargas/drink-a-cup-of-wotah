import initSqlJs from 'sql.js';
import type { SqlDb, SqlParam } from '@/services/db/sqlDb';
import { migrate } from '@/services/db/migrations';

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

/** In-memory SQLite (WASM) implementing SqlDb, with migrations applied. */
export async function createTestDb(): Promise<SqlDb> {
  SQL ??= await initSqlJs();
  const raw = new SQL.Database();
  raw.exec('PRAGMA foreign_keys = ON');

  const rows = <T>(sql: string, params: SqlParam[] = []): T[] => {
    const stmt = raw.prepare(sql);
    try {
      stmt.bind(params);
      const out: T[] = [];
      while (stmt.step()) out.push(stmt.getAsObject() as T);
      return out;
    } finally {
      stmt.free();
    }
  };

  const db: SqlDb = {
    exec: (sql) => raw.exec(sql),
    run: (sql, params = []) => {
      raw.run(sql, params);
      return { changes: raw.getRowsModified() };
    },
    getFirst: (sql, params) => rows<never>(sql, params)[0] ?? null,
    getAll: (sql, params) => rows(sql, params),
    transaction: (fn) => {
      raw.exec('BEGIN');
      try {
        fn();
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
  migrate(db);
  return db;
}
