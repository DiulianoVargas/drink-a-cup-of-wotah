// Global mocks for native modules that cannot run under Jest (Node).

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-notifications', () => ({
  setNotificationCategoryAsync: jest.fn(async () => null),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted', granted: true })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted', granted: true })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: jest.fn(),
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('expo-widgets', () => ({
  createLiveActivity: jest.fn(() => ({ start: jest.fn(), getInstances: jest.fn(() => []) })),
  createWidget: jest.fn(),
  addUserInteractionListener: jest.fn(() => ({ remove: jest.fn() })),
  after: (date: Date) => ({ after: date }),
  widgetsDirectory: null,
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => {
    throw new Error('expo-sqlite is not available in tests; use tests/helpers/sqljsDb.ts');
  }),
}));
