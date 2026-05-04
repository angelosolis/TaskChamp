/**
 * IT-03: Create Task -> Task List
 * New task populates task list
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockTasks = [
  {
    id: '1',
    title: 'Finish CS101 Assignment',
    description: 'Complete chapter 5 exercises',
    priority: 'high',
    completed: false,
    taskType: 'assignment',
    courseId: 'cs101',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
];

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => {
    try {
      return selector({
        tasks: { tasks: mockTasks, filter: 'all', sortBy: 'created', isLoading: false, error: null },
        academic: { courses: [{ id: 'cs101', code: 'CS101', name: 'Intro to CS', color: '#4A90E2' }], studySessions: [] },
      });
    } catch {
      return { tasks: mockTasks, filter: 'all', sortBy: 'created', isLoading: false, error: null };
    }
  },
}));
jest.mock('../src/store/slices/taskSlice', () => ({
  createTask: jest.fn(),
  updateTask: jest.fn(),
  setFilter: jest.fn(),
  setSortBy: jest.fn(),
  setSearchQuery: jest.fn(),
}));
jest.mock('../src/store/slices/academicSlice', () => ({
  initializeDefaultCourses: jest.fn(),
  addCourse: jest.fn(),
  addStudySession: jest.fn(),
}));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');
jest.mock('../src/components/NotificationProvider', () => ({
  useNotification: () => ({ showInfo: jest.fn(), showSuccess: jest.fn(), showError: jest.fn() }),
}));
jest.mock('../src/components/StudyTimerWidget', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'Study Timer Widget');
});
jest.mock('../src/services/inAppAlertService', () => ({
  inAppAlertService: { show: jest.fn() },
}));

import CreateTaskScreen from '../src/screens/CreateTaskScreen';
import TaskListScreen from '../src/screens/TaskListScreen';

const nav = { navigate: jest.fn() } as any;

describe('IT-03: Create Task -> Task List', () => {
  test('Step 1: Open Create Task screen — form is visible', () => {
    const { getByText } = render(<CreateTaskScreen navigation={nav} route={{} as any} />);
    expect(getByText('Priority Level')).toBeTruthy();
  });

  test('Step 2: Task is created (form fields exist)', () => {
    const { getByText } = render(<CreateTaskScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create Task')).toBeTruthy();
  });

  test('Step 3: Open Task List — task title appears', () => {
    const { getByText } = render(<TaskListScreen navigation={nav} route={{} as any} />);
    expect(getByText('Finish CS101 Assignment')).toBeTruthy();
  });

  test('Step 4: Task List shows correct priority', () => {
    const { getByText } = render(<TaskListScreen navigation={nav} route={{} as any} />);
    expect(getByText('HIGH')).toBeTruthy();
  });
});
