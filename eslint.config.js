// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'ios/*', 'android/*', 'coverage/*', 'design/*'],
  },
  {
    // Constitution I: the domain core stays pure and portable.
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react/*', 'react-native', 'react-native/*'], message: 'src/domain must not depend on React.' },
            { group: ['expo', 'expo-*', '@expo/*'], message: 'src/domain must not depend on Expo.' },
          ],
        },
      ],
    },
  },
]);
