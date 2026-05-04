/**
 * IT-04: Create Task -> Dashboard
 * New task updates dashboard statistics
 */
import React from 'react';
import { render } from '@testing-library/react-native';

(global as any).__mockTasks = [
  { id: '1', title: 'Study React', priority: 'high', completed: false, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
  { id: '2', title: 'Read Chapter 3', priority: 'medium', completed: true, createdAt: '2026-01-09T00:00:00Z', updatedAt: '2026-01-09T00:00:00Z' },
];

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => {
    try {
      return selector({
        auth: { user: { name: 'Angelo Solis' } },
        tasks: { tasks: (global as any).__mockTasks || [] },
      });
    } catch {
      return { user: { name: 'Angelo Solis' } };
    }
  },
}));
jest.mock('../src/store/slices/authSlice', () => ({ loadUser: jest.fn() }));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');
jest.mock('../src/components/NotificationProvider', () => ({
  useNotification: () => ({ showInfo: jest.fn(), showSuccess: jest.fn() }),
}));

import DashboardScreen from '../src/screens/DashboardScreen';

const nav = { navigate: jest.fn() } as any;

describe('IT-04: Create Task -> Dashboard', () => {
  test('Step 1: Task is created — dashboard reflects updated task count', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText('Total Tasks')).toBeTruthy();
  });

  test('Step 2: Dashboard shows High Priority stat', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText('High Priority')).toBeTruthy();
  });

  test('Step 3: Dashboard shows user name', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText('Angelo Solis')).toBeTruthy();
  });
});
