import type { DayKey, Sip, SipSource } from '@/domain/types';
import type { SipRepository } from '@/usecases/ports';
import type { SqlDb } from './sqlDb';

type SipRow = {
  id: string;
  day_key: string;
  amount_ml: number;
  occurred_at: number;
  source: string;
  undone_at: number | null;
};

const toSip = (r: SipRow): Sip => ({
  id: r.id,
  dayKey: r.day_key,
  amountMl: r.amount_ml,
  occurredAt: r.occurred_at,
  source: r.source as SipSource,
  undoneAt: r.undone_at,
});

export function createSipRepo(db: SqlDb): SipRepository {
  const latestActive = (dayKey: DayKey) =>
    db.getFirst<SipRow>(
      `SELECT * FROM sip WHERE day_key = ? AND undone_at IS NULL
       ORDER BY occurred_at DESC, rowid DESC LIMIT 1`,
      [dayKey],
    );

  return {
    add(sip: Sip, dayGoalMl: number) {
      db.transaction(() => {
        // The goal in force is recorded on the day's first event (FR-028).
        db.run('INSERT OR IGNORE INTO day (day_key, goal_ml, updated_at) VALUES (?, ?, ?)', [
          sip.dayKey,
          dayGoalMl,
          sip.occurredAt,
        ]);
        db.run(
          'INSERT INTO sip (id, day_key, amount_ml, occurred_at, source, undone_at) VALUES (?, ?, ?, ?, ?, ?)',
          [sip.id, sip.dayKey, sip.amountMl, sip.occurredAt, sip.source, sip.undoneAt],
        );
      });
    },

    undoLast(dayKey: DayKey, at: number) {
      const row = latestActive(dayKey);
      if (!row) return null;
      db.run('UPDATE sip SET undone_at = ? WHERE id = ?', [at, row.id]);
      return toSip({ ...row, undone_at: at });
    },

    totalFor(dayKey: DayKey) {
      return (
        db.getFirst<{ total: number }>(
          'SELECT COALESCE(SUM(amount_ml), 0) AS total FROM sip WHERE day_key = ? AND undone_at IS NULL',
          [dayKey],
        )?.total ?? 0
      );
    },

    lastSipAt(dayKey: DayKey) {
      return latestActive(dayKey)?.occurred_at ?? null;
    },

    goalFor(dayKey: DayKey) {
      return db.getFirst<{ goal_ml: number }>('SELECT goal_ml FROM day WHERE day_key = ?', [dayKey])
        ?.goal_ml ?? null;
    },

    setDayGoal(dayKey: DayKey, goalMl: number) {
      db.run(
        `INSERT INTO day (day_key, goal_ml, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(day_key) DO UPDATE SET goal_ml = excluded.goal_ml, updated_at = excluded.updated_at`,
        [dayKey, goalMl, Date.now()],
      );
    },
  };
}
