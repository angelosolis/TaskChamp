/**
 * Proponent: Gula, Lovelyn | Module: Dashboard Module | Date: 01/15/2026
 * UT_017: No tasks created yet - Display empty state message
 */
import React from 'react';
import { render } from '@testing-library/react-native';

(global as any).__mockTasks = [];

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(() => ({ unwrap: () => Promise.resolve() })),
  useAppSelector: (s: any) => {
    try {
      return s({
        auth: { user: { name: 'Angelo Solis', email: 'angelo@email.com' }, isLoading: false, error: null },
        tasks: { tasks: (global as any).__mockTasks, isLoading: false, error: null },
      });
    } catch {
      return { user: { name: 'Angelo Solis', email: 'angelo@email.com' } };
    }
  },
}));
jest.mock('../src/store/slices/authSlice', () => ({ loadUser: jest.fn(), clearError: jest.fn() }));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');
jest.mock('../src/components/NotificationProvider', () => ({ useNotification: () => ({ showInfo: jest.fn(), showSuccess: jest.fn(), showError: jest.fn() }) }));

import DashboardScreen from '../src/screens/DashboardScreen';
const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;

describe('UT_017: No tasks created yet - Display empty state message', () => {
  test('Step 1: Login and redirect to Dashboard', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Good (morning|afternoon|evening)/)).toBeTruthy();
  });
  test('Step 2: Dashboard loads with empty tasks', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Total Tasks/)).toBeTruthy();
  });
  test('Step 3: Shows empty state message "Ready to start? Create your first task!"', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Ready to start\? Create your first task!/)).toBeTruthy();
  });
});
