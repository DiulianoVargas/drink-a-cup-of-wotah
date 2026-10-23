import Constants from 'expo-constants';
import { Paths } from 'expo-file-system';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { migrate } from './migrations';
import type { SqlDb } from './sqlDb';

const DB_NAME = 'wotah.db';

/** App Group container path (shared with the widget extension), or undefined if unavailable. */
function appGroupDirectory(): string | undefined {
  const group = Constants.expoConfig?.extra?.appGroup as string | undefined;
  if (!group) return undefined;
  const dir = Paths.appleSharedContainers?.[group];
  return dir ? decodeURI(dir.uri.replace(/^file:\/\//, '')) : undefined;
}

function open(): { raw: SQLiteDatabase; location: 'app-group' | 'default' } {
  const dir = appGroupDirectory();
  if (dir) {
    try {
      return { raw: openDatabaseSync(DB_NAME, undefined, dir), location: 'app-group' };
    } catch (e) {
      // Spike S3: fall back to the default directory if the App Group path is not usable.
      console.warn('[db] App Group database unavailable, using default directory', e);
    }
  }
  return { raw: openDatabaseSync(DB_NAME), location: 'default' };
}

function wrap(raw: SQLiteDatabase): SqlDb {
  return {
    exec: (sql) => raw.execSync(sql),
    run: (sql, params = []) => ({ changes: raw.runSync(sql, params).changes }),
    getFirst: (sql, params = []) => raw.getFirstSync(sql, params) ?? null,
    getAll: (sql, params = []) => raw.getAllSync(sql, params),
    transaction: (fn) => raw.withTransactionSync(fn),
  };
}

let instance: { db: SqlDb; location: 'app-group' | 'default'; path: string } | null = null;

/** Opens `wotah.db` once (App Group first, research R6) and applies migrations. */
export function getDb(): SqlDb {
  if (!instance) {
    const { raw, location } = open();
    raw.execSync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    const db = wrap(raw);
    migrate(db);
    instance = { db, location, path: raw.databasePath };
  }
  return instance.db;
}

/** For the dev tools screen (spike S3). */
export function dbInfo() {
  getDb();
  return { location: instance!.location, path: instance!.path };
}
