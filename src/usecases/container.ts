import { getDb } from '@/services/db/client';
import { createEventLog } from '@/services/db/eventLog';
import { createProfileRepo } from '@/services/db/profileRepo';
import { createSipRepo } from '@/services/db/sipRepo';
import { getPermission } from '@/services/notifications/permissions';
import { storeSink, useWotahStore } from '@/state/store';
import { createApp, type App } from './app';
import type { Effect } from './syncSideEffects';

const systemClock = { now: () => new Date() };

/** Local unique id (no crypto.randomUUID in Hermes; uniqueness per device is enough). */
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// Platform side effects, in order. Reminders (US3) and the Live Activity (US4) plug in here.
const effects: Effect[] = [];

let app: App | null = null;

/** Lazily wires the real adapters (SQLite, store, clock) to the use cases. */
export function getApp(): App {
  if (!app) {
    const db = getDb();
    app = createApp(
      {
        sips: createSipRepo(db),
        profiles: createProfileRepo(db),
        events: createEventLog(db),
        clock: systemClock,
        sink: storeSink,
        newId,
      },
      effects,
    );
  }
  return app;
}

async function refreshPermission() {
  useWotahStore.setState({ permission: await getPermission() });
}

/** Boot: open the DB, publish the current state (or mark ready when there is no profile yet). */
export async function bootApp(): Promise<void> {
  await refreshPermission().catch(() => {});
  const today = await getApp().reconcile();
  if (!today) useWotahStore.setState({ ready: true });
}

/** Return to the foreground: permission may have changed in iOS Settings; the day may have rolled over. */
export async function onForeground(): Promise<void> {
  await refreshPermission().catch(() => {});
  await getApp().reconcile();
}
