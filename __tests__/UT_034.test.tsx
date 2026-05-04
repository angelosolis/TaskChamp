/**
 * Proponent: Gula, Lovelyn | Module: Task List Module | Date: 01/15/2026
 * UT_034: Open task list - Display all tasks with status and deadlines
 */
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(() => ({ unwrap: () => Promise.resolve() })),
  useAppSelector: (s: any) => {
    try {
      return s({
        auth: { user: { name: 'Angelo Solis', email: 'angelo@email.com' }, isLoading: false, error: null },
        tasks: {
          tasks: [
            { id: '1', title: 'Study for Finals', description: 'Review chapters', completed: false, priority: 'high', dueDate: '2026-03-20T00:00:00Z', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
            { id: '2', title: 'Submit Report', description: 'Final report', completed: false, priority: 'medium', createdAt: '2026-01-11T00:00:00Z', updatedAt: '2026-01-11T00:00:00Z' },
          ],
          isLoading: false,
          error: null,
          filter: 'all',
          sortBy: 'date',
          searchQuery: '',
        },
      });
    } catch {
      return { user: { name: 'Angelo Solis', email: 'angelo@email.com' } };
    }
  },
}));
jest.mock('../src/store/slices/taskSlice', () => ({ updateTask: jest.fn(), setFilter: jest.fn(), setSortBy: jest.fn(), setSearchQuery: jest.fn() }));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');

import TaskListScreen from '../src/screens/TaskListScreen';
const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;

describe('UT_034: Open task list - Display all tasks with status and deadlines', () => {
  test('Step 1: Navigate to Task List screen', () => {
    const { getByText } = render(<TaskListScreen navigation={nav} route={{} as any} />);
    expect(getByText('Study for Finals')).toBeTruthy();
  });
  test('Step 2: Shows HIGH priority label', () => {
    const { getByText } = render(<TaskListScreen navigation={nav} route={{} as any} />);
    expect(getByText(/HIGH/)).toBeTruthy();
  });
  test('Step 3: Shows "Submit Report" task', () => {
    const { getByText } = render(<TaskListScreen navigation={nav} route={{} as any} />);
    expect(getByText('Submit Report')).toBeTruthy();
  });
  test('Step 4: Shows MEDIUM priority label', () => {
    const { getByText } = render(<TaskListScreen navigation={nav} route={{} as any} />);
    expect(getByText(/MEDIUM/)).toBeTruthy();
  });
});
