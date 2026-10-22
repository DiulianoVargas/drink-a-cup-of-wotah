import * as Notifications from 'expo-notifications';
import type { Reminder } from '@/domain/types';
import type { ReminderScheduler } from '@/usecases/ports';
import type { SqlDb } from '../db/sqlDb';
import { REMINDER_CATEGORY } from './categories';
import { ensureReminderChannel, getPermission, REMINDER_CHANNEL } from './permissions';

export const reminderId = (r: Pick<Reminder, 'dayKey' | 'index'>) => `rem:${r.dayKey}:${r.index}`;

/** Local notification adapter (contracts/notifications.md). The app has no other notifications. */
export function createNotificationScheduler(db: SqlDb): ReminderScheduler {
  const clearRows = () => db.run('DELETE FROM scheduled_reminder');

  return {
    permission: getPermission,

    async cancelAll() {
      await Notifications.cancelAllScheduledNotificationsAsync();
      clearRows();
    },

    async replaceAll(reminders) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      clearRows();
      if ((await getPermission()) !== 'granted') return;
      await ensureReminderChannel();

      for (const r of reminders) {
        const identifier = reminderId(r);
        await Notifications.scheduleNotificationAsync({
          identifier,
          content: {
            title: r.title,
            body: r.body,
            categoryIdentifier: REMINDER_CATEGORY,
            sound: 'default',
            data: { kind: 'reminder', dayKey: r.dayKey, index: r.index },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(r.fireAt),
            channelId: REMINDER_CHANNEL,
          },
        });
        db.run(
          'INSERT OR REPLACE INTO scheduled_reminder (notification_id, day_key, fire_at) VALUES (?, ?, ?)',
          [identifier, r.dayKey, r.fireAt],
        );
      }
    },
  };
}
