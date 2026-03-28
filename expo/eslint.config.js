const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "ios/*", "android/*"],
  },
  {
    rules: {
      // Disable for Expo SDK packages that ESLint can't resolve
      'import/no-unresolved': ['error', { ignore: ['^expo-'] }],
    },
  },
]);
