// Dev-only instrumentation for spikes S1–S4 (research › Required spikes).
// Imported at the top of src/app/_layout.tsx so listeners exist before any event is delivered.
import * as Notifications from 'expo-notifications';
import { addUserInteractionListener } from 'expo-widgets';
import { getDb } from '@/services/db/client';

export const SPIKE_CATEGORY = 'WOTAH_SPIKE';

function record(kind: string, detail: string) {
  const key = `spike:${kind}:${Date.now()}:${detail}`;
  getDb().run('INSERT OR IGNORE INTO processed_event (event_key, processed_at) VALUES (?, ?)', [
    key,
    Date.now(),
  ]);
}

export function spikeLog(): string[] {
  return getDb()
    .getAll<{ event_key: string }>(
      "SELECT event_key FROM processed_event WHERE event_key LIKE 'spike:%' ORDER BY processed_at DESC LIMIT 30",
    )
    .map((r) => r.event_key);
}

export function clearSpikeLog() {
  getDb().run("DELETE FROM processed_event WHERE event_key LIKE 'spike:%'");
}

let registered = false;

export function registerSpikeListeners() {
  if (!__DEV__ || registered) return;
  registered = true;

  // S1: notification action responses (also checked at cold start below).
  Notifications.addNotificationResponseReceivedListener((r) => {
    record('notif-listener', `${r.notification.request.identifier}:${r.actionIdentifier}`);
  });
  const last = Notifications.getLastNotificationResponse();
  if (last) record('notif-last', `${last.notification.request.identifier}:${last.actionIdentifier}`);

  // S2: Live Activity button events (only delivered while JS is observing).
  addUserInteractionListener((e) => record('la-event', `${e.source}:${e.target}`));
}

export async function scheduleSpikeNotification() {
  await Notifications.requestPermissionsAsync();
  await Notifications.setNotificationCategoryAsync(SPIKE_CATEGORY, [
    { identifier: 'DRINK', buttonTitle: 'Bebi 💧', options: { opensAppToForeground: false } },
  ]);
  await Notifications.scheduleNotificationAsync({
    identifier: `spike-${Date.now()}`,
    content: {
      title: 'Spike S1',
      body: 'Encerre o app e toque em "Bebi 💧".',
      categoryIdentifier: SPIKE_CATEGORY,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 },
  });
}
