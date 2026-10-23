import type { NotificationResponse } from 'expo-notifications';
import type { App } from '@/usecases/app';
import { DRINK_ACTION } from './categories';

/**
 * "Bebi 💧" logs without opening the app (FR-016); tapping the body opens it and logs with the
 * "Desfazer" toast (FR-017). The event key makes the same response count once (research R4).
 */
export async function handleNotificationResponse(
  app: Pick<App, 'registerSip'>,
  response: NotificationResponse,
): Promise<void> {
  const { request } = response.notification;
  if ((request.content.data as { kind?: string } | undefined)?.kind !== 'reminder') return;

  const eventKey = `notif:${request.identifier}:${response.actionIdentifier}`;
  const source =
    response.actionIdentifier === DRINK_ACTION ? 'notification_action' : 'notification_tap';
  await app.registerSip(source, { eventKey });
}
