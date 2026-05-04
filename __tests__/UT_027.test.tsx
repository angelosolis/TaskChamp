/**
 * Proponent: Gula, Lovelyn | Module: Task Creation Module | Date: 01/15/2026
 * UT_027: Submit without task title - Show validation error
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { isButtonDisabled } from './helpers';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(() => ({ unwrap: () => Promise.resolve() })),
  useAppSelector: (s: any) => {
    try {
      return s({
        auth: { user: { name: 'Angelo Solis', email: 'angelo@email.com' }, isLoading: false, error: null },
        tasks: { tasks: [], isLoading: false, error: null },
        academic: { courses: [], isLoading: false, error: null },
      });
    } catch {
      return { user: { name: 'Angelo Solis', email: 'angelo@email.com' } };
    }
  },
}));
jest.mock('../src/store/slices/taskSlice', () => ({ createTask: jest.fn() }));
jest.mock('../src/store/slices/academicSlice', () => ({ initializeDefaultCourses: jest.fn(), addCourse: jest.fn() }));
jest.mock('../src/services/inAppAlertService', () => ({ inAppAlertService: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() } }));
jest.mock('../src/components/NotificationProvider', () => ({ useNotification: () => ({ showInfo: jest.fn(), showSuccess: jest.fn(), showError: jest.fn() }) }));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');
jest.mock('../src/components/StudyTimerWidget', () => 'StudyTimerWidget');

import CreateTaskScreen from '../src/screens/CreateTaskScreen';
const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;

describe('UT_027: Submit without task title - Show validation error', () => {
  test('Step 1: Navigate to Create Task screen', () => {
    const { getByText } = render(<CreateTaskScreen navigation={nav} route={{} as any} />);
    expect(getByText('Priority Level')).toBeTruthy();
  });
  test('Step 2: Leave title field empty', () => {
    const { getByText } = render(<CreateTaskScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Create Task/)).toBeTruthy();
  });
  test('Step 3: Tap "Create Task" — button is disabled when title is empty', () => {
    const { getByText } = render(<CreateTaskScreen navigation={nav} route={{} as any} />);
    expect(isButtonDisabled(getByText('Create Task'))).toBe(true);
  });
});
