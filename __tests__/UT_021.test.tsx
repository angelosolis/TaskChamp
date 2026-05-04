/**
 * Proponent: Gula, Lovelyn | Module: Analytics Module | Date: 01/15/2026
 * UT_021: Open Analytics page - Display task completion charts
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockCompletedTasks = [
  { id: '1', title: 'Task A', completed: true, priority: 'high', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z' },
  { id: '2', title: 'Task B', completed: true, priority: 'medium', createdAt: '2026-01-11T00:00:00Z', updatedAt: '2026-01-14T00:00:00Z' },
  { id: '3', title: 'Task C', completed: false, priority: 'low', createdAt: '2026-01-12T00:00:00Z', updatedAt: '2026-01-12T00:00:00Z' },
];
(global as any).__analyticsTasks = mockCompletedTasks;

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(() => ({ unwrap: () => Promise.resolve() })),
  useAppSelector: (s: any) => {
    try {
      return s({
        auth: { user: { name: 'Angelo Solis', email: 'angelo@email.com' }, isLoading: false, error: null },
        tasks: { tasks: (global as any).__analyticsTasks, isLoading: false, error: null },
        academic: { courses: [] },
      });
    } catch {
      return { user: { name: 'Angelo Solis', email: 'angelo@email.com' } };
    }
  },
}));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');

import AnalyticsScreen from '../src/screens/AnalyticsScreen';
const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;

describe('UT_021: Open Analytics page - Display task completion charts', () => {
  test('Step 1: Navigate to Analytics screen', () => {
    const { getByText } = render(<AnalyticsScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Overall Completion Rate/)).toBeTruthy();
  });
  test('Step 2: Shows Weekly Completions section', () => {
    const { getByText } = render(<AnalyticsScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Weekly Completions/)).toBeTruthy();
  });
  test('Step 3: Shows Activity by Day section', () => {
    const { getByText } = render(<AnalyticsScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Activity by Day/)).toBeTruthy();
  });
  test('Step 4: Shows Tasks by Priority section', () => {
    const { getByText } = render(<AnalyticsScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Tasks by Priority/)).toBeTruthy();
  });
});
