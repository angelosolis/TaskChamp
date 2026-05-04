/**
 * IT-15: Task Data -> Analytics
 * Analytics calculates performance
 */
import React from 'react';
import { render } from '@testing-library/react-native';

(global as any).__analyticsTasks = [
  { id: '1', title: 'Study React', priority: 'high', completed: true, taskType: 'study', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-11T00:00:00Z' },
  { id: '2', title: 'Read Chapter 3', priority: 'medium', completed: false, taskType: 'reading', createdAt: '2026-01-08T00:00:00Z', updatedAt: '2026-01-08T00:00:00Z' },
  { id: '3', title: 'Buy groceries', priority: 'low', completed: true, taskType: 'other', createdAt: '2026-01-07T00:00:00Z', updatedAt: '2026-01-08T00:00:00Z' },
];

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => {
    try {
      return selector({
        tasks: { tasks: (global as any).__analyticsTasks || [] },
        academic: {
          courses: [
            { id: 'cs101', code: 'CS101', name: 'Intro to CS', color: '#4A90E2' },
          ],
        },
      });
    } catch {
      return { tasks: (global as any).__analyticsTasks || [] };
    }
  },
}));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');

import AnalyticsScreen from '../src/screens/AnalyticsScreen';

const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;

describe('IT-15: Task Data -> Analytics', () => {
  test('Step 1: Analytics shows Overall Completion Rate', () => {
    const { getByText } = render(<AnalyticsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Overall Completion Rate')).toBeTruthy();
  });

  test('Step 2: Analytics shows Weekly Completions', () => {
    const { getByText } = render(<AnalyticsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Weekly Completions')).toBeTruthy();
  });

  test('Step 3: Analytics shows Activity by Day', () => {
    const { getByText } = render(<AnalyticsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Activity by Day')).toBeTruthy();
  });

  test('Step 4: Analytics shows Tasks by Priority', () => {
    const { getByText } = render(<AnalyticsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Tasks by Priority')).toBeTruthy();
  });

  test('Step 5: Analytics shows Done and Pending counts', () => {
    const { getByText } = render(<AnalyticsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Done')).toBeTruthy();
    expect(getByText('Pending')).toBeTruthy();
  });
});
