import type { Profile, TodayState } from '@/domain/types';
import { getTodayState } from './getTodayState';
import type { Clock, EventLog, LiveActivityPort, ProfileRepository, ReminderScheduler, SipRepository } from './ports';
import { syncSideEffects, type Effect } from './syncSideEffects';

/** What the UI receives after every change. */
export type Published = {
  profile: Profile;
  today: TodayState;
  nextReminderAt: number | null;
};

export interface StateSink {
  publish(p: Published): void;
  requestUndoToast(): void;
}

export type AppDeps = {
  sips: SipRepository;
  profiles: ProfileRepository;
  events: EventLog;
  clock: Clock;
  sink: StateSink;
  scheduler?: ReminderScheduler;
  liveActivity?: LiveActivityPort;
  newId: () => string;
};

/** Wires the use cases to their ports. `effects` are the platform side effects run on every change. */
export function createApp(deps: AppDeps, effects: Effect[]) {
  let last: TodayState | null = null;

  const sync = async (today: TodayState) => {
    const previous = last;
    last = today;
    return syncSideEffects(deps, { today, previous }, effects);
  };

  return {
    deps,
    sync,

    /** Cold start / foreground: re-reads the day (rollover, time zone or clock change) and re-syncs. */
    async reconcile(): Promise<TodayState | null> {
      const today = getTodayState(deps);
      if (!today) return null;
      await sync(today);
      return today;
    },
  };
}

export type App = ReturnType<typeof createApp>;
