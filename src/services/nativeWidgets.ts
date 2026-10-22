import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type WidgetsApi = typeof import('expo-widgets');

/**
 * Live Activities need the native ExpoWidgets module, which only exists in a development/production
 * build. In Expo Go (or tests) it is missing, and importing `expo-widgets` would throw — so every
 * widget import goes through here and the rest of the app keeps working.
 */
export const hasLiveActivities =
  Platform.OS === 'ios' && requireOptionalNativeModule('ExpoWidgets') != null;

export function loadWidgets(): WidgetsApi | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return hasLiveActivities ? (require('expo-widgets') as WidgetsApi) : null;
}
