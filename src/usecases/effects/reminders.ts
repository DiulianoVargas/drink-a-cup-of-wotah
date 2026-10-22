import { planReminders } from '@/domain/reminders';
import type { ReminderScheduler } from '../ports';
import type { Effect } from '../syncSideEffects';

/**
 * Replaces the whole reminder chain on every change (research R4): today's remaining reminders
 * plus the next window. Publishes the next reminder time for the Home hint.
 */
export function createReminderEffect(scheduler: ReminderScheduler): Effect {
  return async ({ profile, today, now }, result) => {
    result.nextReminderAt = null;
    if (!profile.remindersEnabled) {
      await scheduler.cancelAll();
      return;
    }
    if ((await scheduler.permission()) !== 'granted') return;

    const plan = planReminders({
      profile,
      consumedMl: today.consumedMl,
      goalMl: today.goalMl,
      now,
    });
    await scheduler.replaceAll(plan);
    result.nextReminderAt = plan[0]?.fireAt ?? null;
  };
}
