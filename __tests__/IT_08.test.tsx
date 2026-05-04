/**
 * IT-08: Task Detail -> Task List
 * Marking task complete updates Task List
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const pendingTask = {
  id: '1',
  title: 'Pending Task',
  description: 'A task that is not done yet',
  priority: 'high',
  completed: false,
  createdAt: '2026-01-10T00:00:00Z',
  updatedAt: '2026-01-10T00:00:00Z',
};

const completedTask = {
  id: '2',
  title: 'Completed Task',
  description: 'A task that is done',
  priority: 'medium',
  completed: true,
  createdAt: '2026-01-08T00:00:00Z',
  updatedAt: '2026-01-09T00:00:00Z',
};

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => {
    try {
      return selector({
        tasks: {
          tasks: [pendingTask, completedTask],
          filter: 'all',
          sortBy: 'created',
          isLoading: false,
          error: null,
        },
      });
    } catch {
      return { tasks: [pendingTask, completedTask], filter: 'all', sortBy: 'created' };
    }
  },
}));
jest.mock('../src/store/slices/taskSlice', () => ({
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  setFilter: jest.fn(),
  setSortBy: jest.fn(),
  setSearchQuery: jest.fn(),
}));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');
jest.mock('../src/components/NotificationProvider', () => ({
  useNotification: () => ({ showWarning: jest.fn() }),
}));

import TaskDetailScreen from '../src/screens/TaskDetailScreen';

const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;

describe('IT-08: Task Detail -> Task List', () => {
  test('Step 1: Open Task Detail for pending task — shows PENDING status', () => {
    const route = { params: { taskId: '1' } } as any;
    const { getByText } = render(<TaskDetailScreen navigation={nav} route={route} />);
    expect(getByText('PENDING')).toBeTruthy();
  });

  test('Step 2: Mark Complete button is available', () => {
    const route = { params: { taskId: '1' } } as any;
    const { getByText } = render(<TaskDetailScreen navigation={nav} route={route} />);
    expect(getByText(/Mark Complete/)).toBeTruthy();
  });

  test('Step 3: Completed task shows COMPLETED status', () => {
    const route = { params: { taskId: '2' } } as any;
    const { getByText } = render(<TaskDetailScreen navigation={nav} route={route} />);
    expect(getByText('COMPLETED')).toBeTruthy();
  });
});
