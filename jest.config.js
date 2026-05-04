module.exports = {
  preset: 'react-native',
  setupFiles: ['./__tests__/setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-paper|@expo|expo|@react-navigation|react-native-calendars|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context|expo-linear-gradient|expo-constants|@react-native-async-storage|react-native-draggable-flatlist|react-native-worklets|@callstack)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
};
