import type { Profile, TodayState } from '@/domain/types';
import type { AppDeps } from './app';

export type SyncInput = {
  profile: Profile;
  today: TodayState;
  /** State before the change that triggered this sync (null on boot/reconcile). */
  previous: TodayState | null;
  now: Date;
};

export type SyncResult = {
  nextReminderAt: number | null;
};

/** A platform side effect (reminders, Live Activity…). Effects run in order and may fill the result. */
export type Effect = (input: SyncInput, result: SyncResult) => Promise<void>;

/**
 * The single gateway every sip/profile change goes through (contracts/domain-api.md invariant):
 * run each effect, then publish the fresh state to the UI. One failing effect never blocks the rest.
 */
export async function syncSideEffects(
  deps: Pick<AppDeps, 'profiles' | 'clock' | 'sink'>,
  change: { today: TodayState; previous: TodayState | null },
  effects: Effect[],
): Promise<SyncResult> {
  const profile = deps.profiles.get();
  const result: SyncResult = { nextReminderAt: null };
  if (!profile) return result;

  const input: SyncInput = { profile, ...change, now: deps.clock.now() };
  for (const effect of effects) {
    try {
      await effect(input, result);
    } catch (e) {
      console.warn('[sync] effect failed', e);
    }
  }
  deps.sink.publish({ profile, today: change.today, nextReminderAt: result.nextReminderAt });
  return result;
}
