import type { ExpoConfig } from 'expo/config';

const BUNDLE_ID = 'com.diulianovargas.wotah';
const APP_GROUP = `group.${BUNDLE_ID}`;

const config: ExpoConfig = {
  name: 'Wotah',
  slug: 'wotah',
  owner: 'diulidsvargas',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'wotah',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    infoPlist: {
      NSSupportsLiveActivities: true,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_ID,
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-notifications',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F3F9FB',
        dark: { backgroundColor: '#121D25' },
        image: './assets/images/splash-icon.png',
        imageWidth: 96,
      },
    ],
    [
      'expo-widgets',
      {
        groupIdentifier: APP_GROUP,
        enablePushNotifications: false,
        // Home-screen widget is deferred to v2 (research R11); the Live Activity is registered at runtime.
        widgets: [],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appGroup: APP_GROUP,
    eas: { projectId: '444f8b6a-860f-41b2-8b38-4f780fd2ed1f' },
  },
};

export default config;
