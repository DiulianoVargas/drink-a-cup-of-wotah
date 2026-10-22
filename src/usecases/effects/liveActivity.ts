import { toSurfaceState } from '@/domain/surface';
import type { LiveActivityPort } from '../ports';
import type { Effect } from '../syncSideEffects';

/** "Bom trabalho! 🎉" stays a few minutes before the activity goes away (FR-025). */
export const LA_DISMISS_AFTER_MS = 5 * 60_000;

/**
 * Keeps the Live Activity in step with the day (contracts/live-activity.md › Lifecycle). Runs after
 * the reminder effect so the countdown uses the freshly planned next reminder.
 */
export function createLiveActivityEffect(port: LiveActivityPort): Effect {
  return async ({ today }, result) => {
    const state = toSurfaceState(today, result.nextReminderAt);
    if (state.celebrating) {
      // Goal met (now, or while the app was not running): celebrate and end; never start a new one.
      if (port.isRunning()) await port.end(state, LA_DISMISS_AFTER_MS);
      return;
    }
    if (port.isRunning()) await port.update(state);
    else port.start(state); // FR-021; after the 8-hour expiry this restarts it (AS-4.7)
  };
}
