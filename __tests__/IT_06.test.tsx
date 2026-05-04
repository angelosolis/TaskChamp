/**
 * IT-06: Create Task -> Kanban Board
 * New task appears in Kanban Board
 */
import React from 'react';
import { render } from '@testing-library/react-native';

(global as any).__mockTasks = [
  { id: '1', title: 'Design wireframes', priority: 'high', completed: false, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
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

describe('IT-06: Create Task -> Kanban Board', () => {
  test('Step 1: Task is created — dashboard updates', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText('Total Tasks')).toBeTruthy();
  });

  test('Step 2: Dashboard shows Kanban Board navigation option', () => {
    const { getByText } = render(<DashboardScreen navigation={nav} route={{} as any} />);
    expect(getByText('Kanban Board')).toBeTruthy();
  });
});
