import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E3A59',
    primaryContainer: '#E8EBF1',
    secondary: '#4A90E2',
    background: '#FAFBFC',
    surface: '#FFFFFF',
    onSurface: '#2E3A59',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PaperProvider theme={theme}>
          <StatusBar style="light" backgroundColor="#2E3A59" />
          <AppNavigator />
        </PaperProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
