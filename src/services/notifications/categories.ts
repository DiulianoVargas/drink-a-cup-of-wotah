import * as Notifications from 'expo-notifications';

export const REMINDER_CATEGORY = 'WOTAH_REMINDER';
export const DRINK_ACTION = 'DRINK';

/** Category with the single "Bebi 💧" action (FR-016). Registered at boot, before scheduling. */
export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
    {
      identifier: DRINK_ACTION,
      buttonTitle: 'Bebi 💧',
      options: { opensAppToForeground: false },
    },
  ]);
}

/** In the foreground, still show the banner but stay quiet. */
export function configureForegroundPresentation(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}
