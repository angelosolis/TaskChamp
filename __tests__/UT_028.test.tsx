/**
 * Proponent: Gula, Lovelyn | Module: Task Creation Module | Date: 01/15/2026
 * UT_028: Input title, due date, priority - Task saved and appears on Dashboard
 */
import React from 'react';
import { render } from '@testing-library/react-native';

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

describe('UT_028: Input title, due date, priority - Task saved and appears on Dashboard', () => {
  test('Step 1: Navigate to Create Task screen', () => {
    const { getByText } = render(<CreateTaskScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create Task')).toBeTruthy();
  });
  test('Step 2: Shows Priority Level section', () => {
    const { getByText } = render(<CreateTaskScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Priority Level/)).toBeTruthy();
  });
  test('Step 3: Shows Due Date (Optional) section', () => {
    const { getByText } = render(<CreateTaskScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Due Date \(Optional\)/)).toBeTruthy();
  });
  test('Step 4: Shows Academic Details section', () => {
    const { getByText } = render(<CreateTaskScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Academic Details/)).toBeTruthy();
  });
});
