/**
 * Proponent: Gula, Lovelyn | Module: Analytics Module | Date: 01/15/2026
 * UT_022: No completed tasks - Display empty state
 */
import React from 'react';
import { render } from '@testing-library/react-native';

(global as any).__analyticsTasks = [];

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

describe('UT_022: No completed tasks - Display empty state', () => {
  test('Step 1: Navigate to Analytics with no tasks', () => {
    const { getByText } = render(<AnalyticsScreen navigation={nav} route={{} as any} />);
    expect(getByText(/No Data Yet/)).toBeTruthy();
  });
  test('Step 2: Shows empty state message', () => {
    const { getByText } = render(<AnalyticsScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Start creating tasks/)).toBeTruthy();
  });
});
