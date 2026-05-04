// Mock SafeAreaContext to avoid "No safe area value available" errors
jest.mock('react-native-safe-area-context', () => {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
    initialWindowMetrics: { insets, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  return {
    default: {
      call: () => {},
      createAnimatedComponent: (component) => component,
      Value: jest.fn(),
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((val) => val),
    withSpring: jest.fn((val) => val),
    Easing: { linear: jest.fn(), ease: jest.fn() },
  };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  MaterialIcons: 'MaterialIcons',
  Ionicons: 'Ionicons',
}));

// Mock @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Mock expo module (for isRunningInExpoGo)
jest.mock('expo', () => ({
  isRunningInExpoGo: jest.fn(() => false),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  cancelScheduledNotificationAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: {} } },
}));

// Mock AsyncStorage globally
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
}));

// Mock Gemini AI service globally
jest.mock('../src/services/geminiService', () => ({
  getAIInsights: jest.fn(() => Promise.resolve([])),
  getTaskRecommendations: jest.fn(() => Promise.resolve([])),
  getGradeForecasts: jest.fn(() => Promise.resolve([])),
  getStudyTip: jest.fn(() => Promise.resolve('Study tip: Review your notes daily.')),
}));

// Silence all console.warn in tests to keep output clean
jest.spyOn(console, 'warn').mockImplementation(() => {});
