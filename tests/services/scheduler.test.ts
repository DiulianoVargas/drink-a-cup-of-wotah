import * as Notifications from 'expo-notifications';
import type { Reminder } from '@/domain/types';
import { createNotificationScheduler } from '@/services/notifications/scheduler';
import { createTestDb } from '../helpers/sqljsDb';

const N = Notifications as jest.Mocked<typeof Notifications>;

const reminder = (index: number, fireAt: number): Reminder => ({
  index,
  fireAt,
  dayKey: '2026-10-22',
  remainingGlasses: 3,
  title: 'Hora de um golinho! 💧',
  body: 'Faltam 3 copos pra meta de hoje.',
});

describe('notification scheduler (contracts/notifications.md)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('replaceAll cancels everything, then schedules each reminder with the category', async () => {
    const db = await createTestDb();
    const scheduler = createNotificationScheduler(db);
    await scheduler.replaceAll([reminder(0, 1_800_000_000_000), reminder(1, 1_800_000_600_000)]);

    expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(N.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(N.scheduleNotificationAsync).toHaveBeenNthCalledWith(1, {
      identifier: 'rem:2026-10-22:0',
      content: {
        title: 'Hora de um golinho! 💧',
        body: 'Faltam 3 copos pra meta de hoje.',
        categoryIdentifier: 'WOTAH_REMINDER',
        sound: 'default',
        data: { kind: 'reminder', dayKey: '2026-10-22', index: 0 },
      },
      trigger: { type: 'date', date: new Date(1_800_000_000_000), channelId: 'reminders' },
    });
    const cancelOrder = N.cancelAllScheduledNotificationsAsync.mock.invocationCallOrder[0];
    const firstSchedule = N.scheduleNotificationAsync.mock.invocationCallOrder[0];
    expect(cancelOrder).toBeLessThan(firstSchedule);
  });

  it('keeps scheduled_reminder rows in sync with what was scheduled', async () => {
    const db = await createTestDb();
    const scheduler = createNotificationScheduler(db);
    await scheduler.replaceAll([reminder(0, 1), reminder(1, 2)]);
    await scheduler.replaceAll([reminder(0, 3)]);
    expect(db.getAll('SELECT notification_id, fire_at FROM scheduled_reminder')).toEqual([
      { notification_id: 'rem:2026-10-22:0', fire_at: 3 },
    ]);
    await scheduler.cancelAll();
    expect(db.getAll('SELECT * FROM scheduled_reminder')).toEqual([]);
  });

  it('schedules nothing when permission is not granted', async () => {
    N.getPermissionsAsync.mockResolvedValueOnce({ status: 'denied', granted: false } as never);
    const scheduler = createNotificationScheduler(await createTestDb());
    await scheduler.replaceAll([reminder(0, 1)]);
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
