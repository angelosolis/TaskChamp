/**
 * Proponent: Gula, Lovelyn | Module: Profile Module | Date: 01/15/2026
 * UT_012: Open profile page - Display user details with edit options
 */
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(() => ({ unwrap: () => Promise.resolve() })),
  useAppSelector: (s: any) => { try { return s({ auth: { user: { name: 'Angelo Solis', email: 'angelo@email.com' }, isLoading: false, error: null }, tasks: { tasks: [{ id: '1', title: 'T1', completed: true, priority: 'high', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' }], isLoading: false, error: null } }); } catch { return { user: { name: 'Angelo Solis', email: 'angelo@email.com' } }; } },
}));
jest.mock('../src/store/slices/authSlice', () => ({ logoutUser: jest.fn(), loadUser: jest.fn(), clearError: jest.fn() }));
jest.mock('../src/store/slices/taskSlice', () => ({ clearTasks: jest.fn() }));
jest.mock('../src/components/NotificationProvider', () => ({ useNotification: () => ({ showInfo: jest.fn(), showWarning: jest.fn(), showSuccess: jest.fn(), showError: jest.fn() }) }));
jest.mock('../src/components/ModernHeader', () => 'ModernHeader');

import ProfileScreen from '../src/screens/ProfileScreen';
const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;

describe('UT_012: Open profile page - Display user details with edit options', () => {
  test('Step 1: Navigate to Profile tab', () => {
    const { getByText } = render(<ProfileScreen navigation={nav} route={{} as any} />);
    expect(getByText('Your Statistics')).toBeTruthy();
  });
  test('Step 2: Verify user name "Angelo Solis" is displayed', () => {
    const { getByText } = render(<ProfileScreen navigation={nav} route={{} as any} />);
    expect(getByText('Angelo Solis')).toBeTruthy();
  });
  test('Step 3: Verify email "angelo@email.com" is displayed', () => {
    const { getByText } = render(<ProfileScreen navigation={nav} route={{} as any} />);
    expect(getByText('angelo@email.com')).toBeTruthy();
  });
  test('Step 4: Verify edit options are available (Account Settings, Features)', () => {
    const { getByText } = render(<ProfileScreen navigation={nav} route={{} as any} />);
    expect(getByText('Account Settings')).toBeTruthy();
    expect(getByText('Features')).toBeTruthy();
  });
});
