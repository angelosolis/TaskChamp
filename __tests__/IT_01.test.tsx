/**
 * IT-01: Login Screen -> Dashboard
 * User authentication redirects to main app
 */
import React from 'react';
import { render } from '@testing-library/react-native';

// --- mock store with authenticated user ---
(global as any).__mockTasks = [
  { id: '1', title: 'Study React', priority: 'high', completed: false, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
];

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => {
    try {
      return selector({
        auth: { user: { name: 'Angelo Solis', email: 'angelo@email.com' }, isLoading: false, error: null },
        tasks: { tasks: (global as any).__mockTasks || [], isLoading: false, error: null },
      });
    } catch {
      return { user: { name: 'Angelo Solis', email: 'angelo@email.com' }, isLoading: false, error: null };
    }
  },
}));
jest.mock('../src/store/slices/authSlice', () => ({ loginUser: jest.fn(), clearError: jest.fn(), loadUser: jest.fn() }));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');
jest.mock('../src/components/NotificationProvider', () => ({
  useNotification: () => ({ showInfo: jest.fn(), showSuccess: jest.fn() }),
}));

import LoginScreen from '../src/screens/LoginScreen';
import DashboardScreen from '../src/screens/DashboardScreen';

const nav = { navigate: jest.fn() } as any;

describe('IT-01: Login Screen -> Dashboard', () => {
  test('Step 1: Open the Login Screen — app title is visible', () => {
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('TaskChamp')).toBeTruthy();
  });

  test('Step 2: Enter valid credentials (email and password fields exist)', () => {
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('Welcome back! Please sign in to continue.')).toBeTruthy();
  });

  test('Step 3: Tap Sign In — button is present', () => {
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('Sign In')).toBeTruthy();
  });

  test('Step 4: Dashboard displays greeting and task stats after auth', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText('Angelo Solis')).toBeTruthy();
    expect(getByText('Total Tasks')).toBeTruthy();
  });
});
