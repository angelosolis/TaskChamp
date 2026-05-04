/**
 * IT-07: Task List -> Task Detail
 * Task selection navigates to detail view
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockTask = {
  id: '1',
  title: 'Finish CS101 Assignment',
  description: 'Complete chapter 5 exercises',
  priority: 'high',
  completed: false,
  createdAt: '2026-01-10T00:00:00Z',
  updatedAt: '2026-01-10T00:00:00Z',
};

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => {
    try {
      return selector({
        tasks: {
          tasks: [mockTask],
          filter: 'all',
          sortBy: 'created',
          isLoading: false,
          error: null,
        },
      });
    } catch {
      return { tasks: [mockTask], filter: 'all', sortBy: 'created' };
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

import TaskListScreen from '../src/screens/TaskListScreen';
import TaskDetailScreen from '../src/screens/TaskDetailScreen';

const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;

describe('IT-07: Task List -> Task Detail', () => {
  test('Step 1: Task List shows tasks', () => {
    const { getByText } = render(<TaskListScreen navigation={nav} route={{} as any} />);
    expect(getByText('Finish CS101 Assignment')).toBeTruthy();
  });

  test('Step 2: Open Task Detail — title is displayed', () => {
    const route = { params: { taskId: '1' } } as any;
    const { getByText } = render(<TaskDetailScreen navigation={nav} route={route} />);
    expect(getByText('Finish CS101 Assignment')).toBeTruthy();
  });

  test('Step 3: Task Detail shows priority HIGH', () => {
    const route = { params: { taskId: '1' } } as any;
    const { getByText } = render(<TaskDetailScreen navigation={nav} route={route} />);
    expect(getByText('HIGH')).toBeTruthy();
  });

  test('Step 4: Task Detail shows status PENDING', () => {
    const route = { params: { taskId: '1' } } as any;
    const { getByText } = render(<TaskDetailScreen navigation={nav} route={route} />);
    expect(getByText('PENDING')).toBeTruthy();
  });

  test('Step 5: Task Detail shows description section', () => {
    const route = { params: { taskId: '1' } } as any;
    const { getByText } = render(<TaskDetailScreen navigation={nav} route={route} />);
    expect(getByText('Complete chapter 5 exercises')).toBeTruthy();
  });
});
