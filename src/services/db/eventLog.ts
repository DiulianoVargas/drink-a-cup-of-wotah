import type { EventLog } from '@/usecases/ports';
import type { SqlDb } from './sqlDb';

/** Idempotency log for notification responses and Live Activity imports (research R4/R5). */
export function createEventLog(db: SqlDb): EventLog {
  return {
    seen: (key) =>
      db.getFirst('SELECT 1 AS hit FROM processed_event WHERE event_key = ?', [key]) !== null,
    mark: (key, at) => {
      db.run('INSERT OR IGNORE INTO processed_event (event_key, processed_at) VALUES (?, ?)', [
        key,
        at,
      ]);
    },
  };
}
