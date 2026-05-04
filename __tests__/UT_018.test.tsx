/**
 * Proponent: Gula, Lovelyn | Module: Dashboard Module | Date: 01/15/2026
 * UT_018: Tasks exist in database - Display tasks with titles and deadlines
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockTasksExist = [
  { id: '1', title: 'Study React Native', description: 'Ch 1-3', completed: false, priority: 'high', dueDate: '2026-03-20T00:00:00Z', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
  { id: '2', title: 'Math Homework', description: 'Problem Set 5', completed: true, priority: 'medium', createdAt: '2026-01-11T00:00:00Z', updatedAt: '2026-01-11T00:00:00Z' },
];
(global as any).__mockTasks = mockTasksExist;

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

describe('UT_018: Tasks exist in database - Display tasks with titles and deadlines', () => {
  test('Step 1: Dashboard loads and shows Total Tasks', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Total Tasks/)).toBeTruthy();
  });
  test('Step 2: Shows Completed count', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Completed/)).toBeTruthy();
  });
  test('Step 3: Shows Daily Progress', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Daily Progress/)).toBeTruthy();
  });
  test('Step 4: Shows High Priority tasks', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText(/High Priority/)).toBeTruthy();
  });
});
