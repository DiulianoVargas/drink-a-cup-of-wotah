import type { Profile } from '@/domain/types';
import type { ProfileRepository } from '@/usecases/ports';
import type { SqlDb } from './sqlDb';

type Row = {
  weight_kg: number;
  daily_goal_ml: number;
  wake_minutes: number;
  sleep_minutes: number;
  reminders_enabled: number;
  onboarding_completed: number;
};

export function createProfileRepo(db: SqlDb): ProfileRepository {
  return {
    get() {
      const row = db.getFirst<Row>('SELECT * FROM profile WHERE id = 1');
      if (!row) return null;
      return {
        weightKg: row.weight_kg,
        dailyGoalMl: row.daily_goal_ml,
        wakeMinutes: row.wake_minutes,
        sleepMinutes: row.sleep_minutes,
        remindersEnabled: row.reminders_enabled === 1,
        onboardingCompleted: row.onboarding_completed === 1,
      };
    },
    save(p: Profile) {
      db.run(
        `INSERT INTO profile (id, weight_kg, daily_goal_ml, wake_minutes, sleep_minutes,
           reminders_enabled, onboarding_completed, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           weight_kg = excluded.weight_kg,
           daily_goal_ml = excluded.daily_goal_ml,
           wake_minutes = excluded.wake_minutes,
           sleep_minutes = excluded.sleep_minutes,
           reminders_enabled = excluded.reminders_enabled,
           onboarding_completed = excluded.onboarding_completed,
           updated_at = excluded.updated_at`,
        [
          p.weightKg,
          p.dailyGoalMl,
          p.wakeMinutes,
          p.sleepMinutes,
          p.remindersEnabled ? 1 : 0,
          p.onboardingCompleted ? 1 : 0,
          Date.now(),
        ],
      );
    },
  };
}
