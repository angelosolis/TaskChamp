/**
 * IT-14: Course Data -> Grade Forecast
 * AI predicts grades
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
            { id: '1', title: 'CS101 Exam Prep', priority: 'high', completed: true, taskType: 'exam', courseId: 'cs101', grade: 88, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
          ],
        },
        academic: {
          courses: [
            { id: 'cs101', code: 'CS101', name: 'Introduction to Computer Science', color: '#4A90E2' },
          ],
        },
      });
    } catch {
      return {
        tasks: [],
        courses: [{ id: 'cs101', code: 'CS101', name: 'Introduction to Computer Science', color: '#4A90E2' }],
      };
    }
  },
}));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');
jest.mock('../src/components/NotificationProvider', () => ({
  useNotification: () => ({ showInfo: jest.fn(), showSuccess: jest.fn() }),
}));

import GradeForecastScreen from '../src/screens/GradeForecastScreen';

const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;

describe('IT-14: Course Data -> Grade Forecast', () => {
  test('Step 1: Grade Forecast shows TASK AI Forecasting text', () => {
    const { getByText } = render(<GradeForecastScreen navigation={nav} route={{} as any} />);
    expect(getByText('TASK AI Forecasting')).toBeTruthy();
  });
});
