/**
 * IT-13: Task Data -> AI Insights
 * AI analyzes tasks
 */
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => {
    try {
      return selector({
        tasks: {
          tasks: [
            { id: '1', title: 'Study React', priority: 'high', completed: false, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
            { id: '2', title: 'Read Chapter 3', priority: 'medium', completed: true, createdAt: '2026-01-08T00:00:00Z', updatedAt: '2026-01-09T00:00:00Z' },
            { id: '3', title: 'Buy groceries', priority: 'low', completed: false, createdAt: '2026-01-07T00:00:00Z', updatedAt: '2026-01-07T00:00:00Z' },
          ],
        },
        academic: {
          courses: [
            { id: 'cs101', code: 'CS101', name: 'Intro to CS', color: '#4A90E2' },
          ],
        },
      });
    } catch {
      return {
        tasks: [
          { id: '1', title: 'Study React', priority: 'high', completed: false, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
          { id: '2', title: 'Read Chapter 3', priority: 'medium', completed: true, createdAt: '2026-01-08T00:00:00Z', updatedAt: '2026-01-09T00:00:00Z' },
          { id: '3', title: 'Buy groceries', priority: 'low', completed: false, createdAt: '2026-01-07T00:00:00Z', updatedAt: '2026-01-07T00:00:00Z' },
        ],
      };
    }
  },
}));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');
jest.mock('../src/components/NotificationProvider', () => ({
  useNotification: () => ({ showInfo: jest.fn(), showSuccess: jest.fn() }),
}));

import AIInsightsScreen from '../src/screens/AIInsightsScreen';

const nav = { navigate: jest.fn() } as any;

describe('IT-13: Task Data -> AI Insights', () => {
  test('Step 1: AI Insights shows Quick Statistics', () => {
    const { getByText } = render(<AIInsightsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Quick Statistics')).toBeTruthy();
  });

  test('Step 2: AI Insights shows Priority Distribution', () => {
    const { getByText } = render(<AIInsightsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Priority Distribution')).toBeTruthy();
  });

  test('Step 3: AI Insights shows Overall Completion Rate', () => {
    const { getByText } = render(<AIInsightsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Overall Completion Rate')).toBeTruthy();
  });
});
