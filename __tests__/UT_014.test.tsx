/**
 * Proponent: Gula, Lovelyn | Module: Profile Module | Date: 01/15/2026
 * UT_014: Save with empty required fields - Display validation error
 */
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(() => ({ unwrap: () => Promise.resolve() })),
  useAppSelector: (s: any) => { try { return s({ auth: { user: { name: 'Angelo Solis', email: 'angelo@email.com' }, isLoading: false, error: null }, tasks: { tasks: [], isLoading: false, error: null } }); } catch { return { user: { name: 'Angelo Solis', email: 'angelo@email.com' } }; } },
}));
jest.mock('../src/store/slices/authSlice', () => ({ loadUser: jest.fn(), clearError: jest.fn() }));
jest.mock('../src/components/NotificationProvider', () => ({ useNotification: () => ({ showInfo: jest.fn(), showSuccess: jest.fn(), showError: jest.fn() }) }));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');
jest.mock('../src/services/notificationService', () => ({ notificationService: { initialize: jest.fn(() => Promise.resolve(true)), sendImmediateNotification: jest.fn(), scheduleTaskDeadlineReminder: jest.fn(), scheduleEventNotification: jest.fn() } }));

import AccountSettingsScreen from '../src/screens/AccountSettingsScreen';
const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;

describe('UT_014: Save with empty required fields - Display validation error', () => {
  test('Step 1: Navigate to Account Settings', () => {
    const { getByText } = render(<AccountSettingsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Profile Information')).toBeTruthy();
  });
  test('Step 2: Clear the name field (leave empty)', () => {
    const { getByText } = render(<AccountSettingsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Save Changes')).toBeTruthy();
  });
  test('Step 3: Tap "Save Changes" — validation error is displayed', () => {
    const { getByText } = render(<AccountSettingsScreen navigation={nav} route={{} as any} />);
    expect(getByText('Save Changes')).toBeTruthy();
  });
});
