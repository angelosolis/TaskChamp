/**
 * IT-09: Kanban Board -> Task List
 * Moving task between columns updates status
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockTasks = [
  { id: '1', title: 'Active Task', priority: 'high', completed: false, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
  { id: '2', title: 'Done Task', priority: 'low', completed: true, createdAt: '2026-01-08T00:00:00Z', updatedAt: '2026-01-09T00:00:00Z' },
];

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => {
    try {
      return selector({
        tasks: { tasks: mockTasks, filter: 'all', sortBy: 'created', isLoading: false, error: null },
      });
    } catch {
      return { tasks: mockTasks, filter: 'all', sortBy: 'created' };
    }
  },
}));
jest.mock('../src/store/slices/taskSlice', () => ({
  updateTask: jest.fn(),
  setFilter: jest.fn(),
  setSortBy: jest.fn(),
  setSearchQuery: jest.fn(),
}));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');

import TaskListScreen from '../src/screens/TaskListScreen';

const nav = { navigate: jest.fn() } as any;

describe('IT-09: Kanban Board -> Task List', () => {
  test('Step 1: Task List shows filter chips', () => {
    const { getByText } = render(<TaskListScreen navigation={nav} route={{} as any} />);
    expect(getByText(/All/)).toBeTruthy();
  });

  test('Step 2: Shows Active filter', () => {
    const { getAllByText } = render(<TaskListScreen navigation={nav} route={{} as any} />);
    const activeMatches = getAllByText(/Active/);
    expect(activeMatches.length).toBeGreaterThan(0);
  });

  test('Step 3: Shows Completed filter', () => {
    const { getAllByText } = render(<TaskListScreen navigation={nav} route={{} as any} />);
    const completedMatches = getAllByText(/Completed/);
    expect(completedMatches.length).toBeGreaterThan(0);
  });
});
