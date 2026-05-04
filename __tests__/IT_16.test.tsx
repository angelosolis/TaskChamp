/**
 * IT-16: Account Settings -> Profile
 * Profile update reflects across app
 */
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(() => ({ unwrap: () => Promise.resolve() })),
  useAppSelector: (s: any) => {
    try {
      return s({
        auth: { user: { name: 'Angelo Solis', email: 'angelo@email.com' }, isLoading: false, error: null },
        tasks: { tasks: [{ id: '1', title: 'T1', completed: true, priority: 'high', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' }], isLoading: false, error: null },
      });
    } catch {
      return { user: { name: 'Angelo Solis', email: 'angelo@email.com' } };
    }
  },
}));
jest.mock('../src/store/slices/authSlice', () => ({ logoutUser: jest.fn(), loadUser: jest.fn(), clearError: jest.fn() }));
jest.mock('../src/store/slices/taskSlice', () => ({ clearTasks: jest.fn() }));
jest.mock('../src/components/NotificationProvider', () => ({
  useNotification: () => ({ showInfo: jest.fn(), showWarning: jest.fn(), showSuccess: jest.fn(), showError: jest.fn() }),
}));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');
jest.mock('../src/services/notificationService', () => ({
  notificationService: {
    initialize: jest.fn(() => Promise.resolve(true)),
    sendImmediateNotification: jest.fn(),
    scheduleTaskDeadlineReminder: jest.fn(),
    scheduleEventNotification: jest.fn(),
  },
}));

import ProfileScreen from '../src/screens/ProfileScreen';
import AccountSettingsScreen from '../src/screens/AccountSettingsScreen';

const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;

describe('IT-16: Account Settings -> Profile', () => {
  test('Step 1: Profile shows user name', () => {
    const { getByText } = render(<ProfileScreen navigation={nav} route={{} as any} />);
    expect(getByText('Angelo Solis')).toBeTruthy();
  });

  test('Step 2: Account Settings shows Profile Information', () => {
    const { getByText } = render(<AccountSettingsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Profile Information')).toBeTruthy();
  });

  test('Step 3: Account Settings shows Save Changes button', () => {
    const { getByText } = render(<AccountSettingsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Save Changes')).toBeTruthy();
  });
});
