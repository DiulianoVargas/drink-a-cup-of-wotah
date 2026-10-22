import { getDb } from '@/services/db/client';
import { createEventLog } from '@/services/db/eventLog';
import { createProfileRepo } from '@/services/db/profileRepo';
import { createSipRepo } from '@/services/db/sipRepo';
import * as Notifications from 'expo-notifications';
import {
  configureForegroundPresentation,
  registerNotificationCategories,
} from '@/services/notifications/categories';
import { getPermission } from '@/services/notifications/permissions';
import { handleNotificationResponse } from '@/services/notifications/responses';
import { createNotificationScheduler } from '@/services/notifications/scheduler';
import { storeSink, useWotahStore } from '@/state/store';
import { createApp, type App } from './app';
import { createReminderEffect } from './effects/reminders';
import type { Effect } from './syncSideEffects';

const systemClock = { now: () => new Date() };

/** Local unique id (no crypto.randomUUID in Hermes; uniqueness per device is enough). */
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let app: App | null = null;

/** Lazily wires the real adapters (SQLite, notifications, store, clock) to the use cases. */
export function getApp(): App {
  if (!app) {
    const db = getDb();
    const scheduler = createNotificationScheduler(db);
    // Platform side effects, in order. The Live Activity (US4) plugs in here.
    const effects: Effect[] = [createReminderEffect(scheduler)];
    app = createApp(
      {
        sips: createSipRepo(db),
        profiles: createProfileRepo(db),
        events: createEventLog(db),
        clock: systemClock,
        sink: storeSink,
        scheduler,
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

/** A response delivered while JS was not running (cold start from a notification). */
async function processLastNotificationResponse() {
  const last = Notifications.getLastNotificationResponse();
  if (!last) return;
  await handleNotificationResponse(getApp(), last);
  Notifications.clearLastNotificationResponse();
}

/** Called at module scope (src/app/_layout.tsx) so iOS background responses find a listener. */
export function listenToNotificationResponses(): void {
  configureForegroundPresentation();
  Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationResponse(getApp(), response).catch((e) =>
      console.warn('[notifications] response failed', e),
    );
  });
}

/** Boot: open the DB, publish the current state (or mark ready when there is no profile yet). */
export async function bootApp(): Promise<void> {
  await registerNotificationCategories().catch(() => {});
  await refreshPermission().catch(() => {});
  await processLastNotificationResponse().catch(() => {});
  const today = await getApp().reconcile();
  if (!today) useWotahStore.setState({ ready: true });
}

/** Return to the foreground: permission may have changed in iOS Settings; the day may have rolled over. */
export async function onForeground(): Promise<void> {
  await refreshPermission().catch(() => {});
  await processLastNotificationResponse().catch(() => {});
  await getApp().reconcile();
}
