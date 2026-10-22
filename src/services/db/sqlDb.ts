export type SqlParam = string | number | null;

/** Minimal synchronous SQLite surface used by the repositories (expo-sqlite in the app, sql.js in tests). */
export interface SqlDb {
  exec(sql: string): void;
  run(sql: string, params?: SqlParam[]): { changes: number };
  getFirst<T>(sql: string, params?: SqlParam[]): T | null;
  getAll<T>(sql: string, params?: SqlParam[]): T[];
  transaction(fn: () => void): void;
}
