import * as Notifications from 'expo-notifications';
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

/** Asked only at onboarding step 4, after the explainer (contracts/notifications.md). */
export async function requestPermission(): Promise<PermissionStatus> {
  return toStatus(
    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    }),
  );
}
