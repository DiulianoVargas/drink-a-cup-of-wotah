import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import type { PermissionStatus } from '@/usecases/ports';

const toStatus = (r: { status: string; granted?: boolean }): PermissionStatus =>
  r.granted || r.status === 'granted'
    ? 'granted'
    : r.status === 'denied'
      ? 'denied'
      : 'undetermined';

export async function getPermission(): Promise<PermissionStatus> {
  return toStatus(await Notifications.getPermissionsAsync());
}

/** Android channel for reminders; Android 13+ shows no permission prompt until a channel exists. */
export const REMINDER_CHANNEL = 'reminders';

export async function ensureReminderChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: 'Lembretes de água',
    importance: AndroidImportance.HIGH,
  });
}

/** Asked only at onboarding step 4, after the explainer (contracts/notifications.md). */
export async function requestPermission(): Promise<PermissionStatus> {
  await ensureReminderChannel();
  return toStatus(
    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    }),
  );
}
