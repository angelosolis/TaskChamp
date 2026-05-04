/**
 * IT-11: Create Task (Academic) -> Academic Hub
 * Academic task links to course
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
            { id: '1', title: 'CS101 Homework', priority: 'high', completed: false, taskType: 'assignment', courseId: 'cs101', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
          ],
        },
        academic: {
          courses: [
            { id: 'cs101', code: 'CS101', name: 'Introduction to Computer Science', color: '#4A90E2' },
          ],
          studySessions: [],
        },
      });
    } catch {
      return { courses: [], studySessions: [] };
    }
  },
}));
jest.mock('../src/store/slices/academicSlice', () => ({
  initializeDefaultCourses: jest.fn(),
  addCourse: jest.fn(),
  addStudySession: jest.fn(),
}));
jest.mock('../src/components/NotificationProvider', () => ({
  useNotification: () => ({ showInfo: jest.fn(), showSuccess: jest.fn() }),
}));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');
jest.mock('../src/components/StudyTimerWidget', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'Study Timer Widget');
});
jest.mock('../src/services/studyTimerService', () => ({
  studyTimerService: { getStudyStats: jest.fn(() => Promise.resolve(null)) },
}));

import AcademicScreen from '../src/screens/AcademicScreen';

const nav = { navigate: jest.fn() } as any;

describe('IT-11: Create Task (Academic) -> Academic Hub', () => {
  test('Step 1: Academic Hub shows course code CS101', () => {
    const { getByText } = render(<AcademicScreen navigation={nav} route={{} as any} />);
    expect(getByText('CS101')).toBeTruthy();
  });

  test('Step 2: Academic Hub shows course name', () => {
    const { getByText } = render(<AcademicScreen navigation={nav} route={{} as any} />);
    expect(getByText('Introduction to Computer Science')).toBeTruthy();
  });
});
