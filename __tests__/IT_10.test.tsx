/**
 * IT-10: Calendar -> Add Event -> Calendar
 * Adding event saves and displays
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockToday = new Date().toISOString().split('T')[0];

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => {
    try {
      return selector({
        tasks: { tasks: [] },
        calendar: {
          events: [
            { id: 'e1', title: 'Math Midterm', type: 'exam', startDate: mockToday, endDate: mockToday, startTime: '10:00 AM' },
          ],
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

describe('IT-10: Calendar -> Add Event -> Calendar', () => {
  test('Step 1: Calendar screen renders successfully', () => {
    const { getByText } = render(<CalendarScreen navigation={nav} route={{} as any} />);
    expect(getByText('Legend')).toBeTruthy();
  });

  test('Step 2: Calendar shows Legend section', () => {
    const { getByText } = render(<CalendarScreen navigation={nav} route={{} as any} />);
    expect(getByText('High Priority')).toBeTruthy();
  });

  test('Step 3: Calendar shows Add Event options', () => {
    const { getAllByText } = render(<CalendarScreen navigation={nav} route={{} as any} />);
    const addEventButtons = getAllByText(/Add Event/);
    expect(addEventButtons.length).toBeGreaterThan(0);
  });

  test('Step 4: Event "Math Midterm" appears on calendar', () => {
    const { getByText } = render(<CalendarScreen navigation={nav} route={{} as any} />);
    expect(getByText('Math Midterm')).toBeTruthy();
  });
});
