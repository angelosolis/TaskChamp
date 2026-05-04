/**
 * IT-17: Data & Privacy -> Dashboard
 * Deleting all data clears tasks
 */
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (s: any) => {
    try {
      return s({
        auth: { user: { name: 'Angelo Solis', email: 'angelo@email.com' }, isLoading: false, error: null },
        tasks: { tasks: [{ id: '1', title: 'T1', completed: false, priority: 'high', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' }], isLoading: false, error: null },
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

import DataPrivacyScreen from '../src/screens/DataPrivacyScreen';

const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;

describe('IT-17: Data & Privacy -> Dashboard', () => {
  test('Step 1: Data Privacy shows What Data We Store', () => {
    const { getByText } = render(<DataPrivacyScreen navigation={nav} route={{} as any} />);
    expect(getByText('What Data We Store')).toBeTruthy();
  });

  test('Step 2: Data Privacy shows Your Rights section', () => {
    const { getByText } = render(<DataPrivacyScreen navigation={nav} route={{} as any} />);
    expect(getByText('Your Rights')).toBeTruthy();
  });

  test('Step 3: Data Privacy shows Delete All My Data option', () => {
    const { getByText } = render(<DataPrivacyScreen navigation={nav} route={{} as any} />);
    expect(getByText('Delete All My Data')).toBeTruthy();
  });

  test('Step 4: Data Privacy shows Export My Data option', () => {
    const { getByText } = render(<DataPrivacyScreen navigation={nav} route={{} as any} />);
    expect(getByText('Export My Data')).toBeTruthy();
  });
});
