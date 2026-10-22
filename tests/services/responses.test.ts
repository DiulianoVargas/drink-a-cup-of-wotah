import { handleNotificationResponse } from '@/services/notifications/responses';

const response = (identifier: string, actionIdentifier: string, kind = 'reminder') =>
  ({
    actionIdentifier,
    notification: { request: { identifier, content: { data: { kind } } } },
  }) as never;

const DEFAULT = 'expo.modules.notifications.actions.DEFAULT';

describe('handleNotificationResponse (FR-016, FR-017)', () => {
  const registerSip = jest.fn(async () => null);
  const app = { registerSip } as never;
  beforeEach(() => registerSip.mockClear());

  it('"Bebi 💧" logs a sip without opening the app', async () => {
    await handleNotificationResponse(app, response('rem:2026-10-22:0', 'DRINK'));
    expect(registerSip).toHaveBeenCalledWith('notification_action', {
      eventKey: 'notif:rem:2026-10-22:0:DRINK',
    });
  });

  it('tapping the body logs a sip as a tap (the app shows "Desfazer")', async () => {
    await handleNotificationResponse(app, response('rem:2026-10-22:1', DEFAULT));
    expect(registerSip).toHaveBeenCalledWith('notification_tap', {
      eventKey: `notif:rem:2026-10-22:1:${DEFAULT}`,
    });
  });

  it('uses one event key per notification+action, so duplicates are ignored downstream', async () => {
    await handleNotificationResponse(app, response('rem:a', 'DRINK'));
    await handleNotificationResponse(app, response('rem:a', 'DRINK'));
    await handleNotificationResponse(app, response('rem:b', 'DRINK'));
    const keys = registerSip.mock.calls.map((c) => (c as unknown[])[1]);
    expect(keys).toEqual([
      { eventKey: 'notif:rem:a:DRINK' },
      { eventKey: 'notif:rem:a:DRINK' },
      { eventKey: 'notif:rem:b:DRINK' },
    ]);
  });

  it('ignores notifications that are not Wotah reminders', async () => {
    await handleNotificationResponse(app, response('spike-1', 'DRINK', 'spike'));
    expect(registerSip).not.toHaveBeenCalled();
  });
});
