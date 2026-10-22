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
