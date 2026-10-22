import type { App } from './app';

/** Target of the Live Activity "Bebi 💧" button (namespaced so dev spike buttons never log sips). */
export const LIVE_ACTIVITY_DRINK_TARGET = 'wotah-drink';

type InteractionEvent = { source: string; target: string; timestamp: number; type?: string };

/**
 * FR-023: a Live Activity button only emits an in-process event (research › Implementation
 * findings); the app logs the sip and the resulting sync updates the activity.
 */
export async function handleLiveActivityInteraction(
  app: Pick<App, 'registerSip'>,
  event: InteractionEvent,
): Promise<void> {
  if (event.target !== LIVE_ACTIVITY_DRINK_TARGET) return;
  await app.registerSip('live_activity', {
    eventKey: `la:${event.source}:${event.timestamp}`,
  });
}

/**
 * Taps the Swift module (modules/wotah-native) recorded while JS was not listening, e.g. when iOS
 * launched the terminated app for the Live Activity intent. Same event keys as the live path, so a
 * tap delivered both ways counts once.
 */
export async function importPendingInteractions(
  app: Pick<App, 'registerSip'>,
  events: InteractionEvent[],
): Promise<void> {
  for (const event of events) await handleLiveActivityInteraction(app, event);
}
