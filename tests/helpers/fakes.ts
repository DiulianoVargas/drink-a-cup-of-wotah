import type { Reminder, SurfaceState } from '@/domain/types';
import type { Profile } from '@/domain/types';
import { createEventLog } from '@/services/db/eventLog';
import { createProfileRepo } from '@/services/db/profileRepo';
import { createSipRepo } from '@/services/db/sipRepo';
import type { AppDeps, StateSink, Published } from '@/usecases/app';
import type {
  Clock,
  LiveActivityPort,
  PermissionStatus,
  ReminderScheduler,
} from '@/usecases/ports';
import { createTestDb } from './sqljsDb';

export class FixedClock implements Clock {
  constructor(private current: Date) {}
  now() {
    return new Date(this.current);
  }
  set(date: Date) {
    this.current = date;
  }
  advanceMinutes(minutes: number) {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

export class FakeScheduler implements ReminderScheduler {
  scheduled: Reminder[] = [];
  replaceCalls = 0;
  cancelCalls = 0;
  status: PermissionStatus = 'granted';
  async replaceAll(reminders: Reminder[]) {
    this.replaceCalls++;
    this.scheduled = this.status === 'granted' ? [...reminders] : [];
  }
  async cancelAll() {
    this.cancelCalls++;
    this.scheduled = [];
  }
  async permission() {
    return this.status;
  }
}

export class FakeLiveActivity implements LiveActivityPort {
  running: { id: string; state: SurfaceState } | null = null;
  started = 0;
  updates: SurfaceState[] = [];
  ended: { state: SurfaceState; afterMs: number }[] = [];
  isRunning() {
    return this.running !== null;
  }
  start(state: SurfaceState) {
    this.started++;
    this.running = { id: `la-${this.started}`, state };
  }
  async update(state: SurfaceState) {
    this.updates.push(state);
    if (this.running) this.running.state = state;
  }
  async end(state: SurfaceState, afterMs: number) {
    this.ended.push({ state, afterMs });
    this.running = null;
  }
}

export class FakeSink implements StateSink {
  published: Published[] = [];
  toasts = 0;
  celebrations = 0;
  publish(p: Published) {
    this.published.push(p);
  }
  requestUndoToast() {
    this.toasts++;
  }
  requestCelebration() {
    this.celebrations++;
  }
  get last() {
    return this.published[this.published.length - 1];
  }
}

export const PROFILE: Profile = {
  weightKg: 70,
  dailyGoalMl: 2000,
  wakeMinutes: 8 * 60,
  sleepMinutes: 22 * 60,
  remindersEnabled: true,
  onboardingCompleted: true,
};

/** Real repositories on in-memory SQLite + fakes for every platform port. */
export async function createTestDeps(opts: { now: Date; profile?: Profile | null }) {
  const db = await createTestDb();
  const profiles = createProfileRepo(db);
  if (opts.profile !== null) profiles.save(opts.profile ?? PROFILE);
  let n = 0;
  const deps = {
    sips: createSipRepo(db),
    profiles,
    events: createEventLog(db),
    clock: new FixedClock(opts.now),
    sink: new FakeSink(),
    scheduler: new FakeScheduler(),
    liveActivity: new FakeLiveActivity(),
    newId: () => `sip-${++n}`,
  } satisfies AppDeps;
  return deps;
}
