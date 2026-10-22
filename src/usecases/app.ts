import { GLASS_ML } from '@/domain/constants';
import { dayKeyFor } from '@/domain/day';
import type { Profile, SipSource, TodayState } from '@/domain/types';
import { getTodayState } from './getTodayState';
import type {
  Clock,
  EventLog,
  LiveActivityPort,
  ProfileRepository,
  ReminderScheduler,
  SipRepository,
} from './ports';
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

/** Sips the user sees happen in the app get the "Desfazer" toast (FR-003, FR-017). */
const TOAST_SOURCES = new Set<SipSource>(['button', 'notification_tap']);

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

    /**
     * Logs one 250 ml sip (FR-001) and re-syncs every surface (FR-015, FR-024).
     * With an `eventKey`, the same external event (notification response, deep link) logs once.
     */
    async registerSip(
      source: SipSource,
      opts: { eventKey?: string } = {},
    ): Promise<TodayState | null> {
      const profile = deps.profiles.get();
      if (!profile) return null;
      if (opts.eventKey && deps.events.seen(opts.eventKey)) return getTodayState(deps);

      const now = deps.clock.now();
      const dayKey = dayKeyFor(now, profile.wakeMinutes);
      deps.sips.add(
        {
          id: deps.newId(),
          amountMl: GLASS_ML,
          occurredAt: now.getTime(),
          dayKey,
          source,
          undoneAt: null,
        },
        profile.dailyGoalMl,
      );
      if (opts.eventKey) deps.events.mark(opts.eventKey, now.getTime());

      const today = getTodayState(deps)!;
      await sync(today);
      if (TOAST_SOURCES.has(source)) deps.sink.requestUndoToast();
      return today;
    },

    /** FR-003: removes the day's most recent sip; null (no change) when there is none. */
    async undoLastSip(): Promise<TodayState | null> {
      const profile = deps.profiles.get();
      if (!profile) return null;
      const now = deps.clock.now();
      const undone = deps.sips.undoLast(dayKeyFor(now, profile.wakeMinutes), now.getTime());
      if (!undone) return null;
      const today = getTodayState(deps)!;
      await sync(today);
      return today;
    },

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
