/** Shared Jest settings. Each config sets process.env.TZ before workers start. */
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo/ios',
  roots: ['<rootDir>/tests'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  // Reanimated's Jest resolver (wraps the Worklets one) picks the JS entry points.
  resolver: 'react-native-reanimated/jest/resolver',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|zustand)',
  ],
};
