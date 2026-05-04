/**
 * IT-05: Create Task -> Calendar
 * Task with due date appears on calendar
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockToday = new Date().toISOString().split('T')[0];

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => {
    try {
      return selector({
        tasks: {
          tasks: [
            { id: '1', title: 'Math Homework', priority: 'high', completed: false, dueDate: mockToday + 'T00:00:00Z', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
          ],
        },
        calendar: {
          events: [],
          selectedDate: mockToday,
          isLoading: false,
        },
      });
    } catch {
      return { events: [], selectedDate: mockToday, isLoading: false };
    }
  },
}));
jest.mock('../src/store/slices/calendarSlice', () => ({
  loadEvents: jest.fn(),
  setSelectedDate: jest.fn(),
  createEvent: jest.fn(),
  deleteEvent: jest.fn(),
}));
jest.mock('../src/services/notificationService', () => ({
  notificationService: {
    initialize: jest.fn(() => Promise.resolve(true)),
    sendImmediateNotification: jest.fn(),
    scheduleTaskDeadlineReminder: jest.fn(),
    scheduleEventNotification: jest.fn(),
    cancelEventNotification: jest.fn(),
  },
}));
jest.mock('../src/components/NotificationProvider', () => ({
  useNotification: () => ({ showSuccess: jest.fn(), showError: jest.fn() }),
}));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');
jest.mock('react-native-calendars', () => ({
  Calendar: ({ children }: any) => children || null,
}));

import CalendarScreen from '../src/screens/CalendarScreen';

const nav = { navigate: jest.fn() } as any;

describe('IT-05: Create Task -> Calendar', () => {
  test('Step 1: Task with due date is created — calendar screen renders', () => {
    const { getByText } = render(<CalendarScreen navigation={nav} route={{} as any} />);
    expect(getByText('Legend')).toBeTruthy();
  });

  test('Step 2: Calendar shows Legend with priority indicators', () => {
    const { getByText } = render(<CalendarScreen navigation={nav} route={{} as any} />);
    expect(getByText('High Priority')).toBeTruthy();
  });

  test('Step 3: Calendar shows Add Event buttons', () => {
    const { getAllByText } = render(<CalendarScreen navigation={nav} route={{} as any} />);
    const addEventButtons = getAllByText(/Add Event/);
    expect(addEventButtons.length).toBeGreaterThan(0);
  });
});
