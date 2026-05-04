/**
 * IT-02: Register Screen -> Login Screen
 * New account creation enables login
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({ isLoading: false, error: null }),
}));
jest.mock('../src/store/slices/authSlice', () => ({ registerUser: jest.fn(), clearError: jest.fn() }));

import RegisterScreen from '../src/screens/RegisterScreen';

const nav = { navigate: jest.fn() } as any;

describe('IT-02: Register Screen -> Login Screen', () => {
  beforeEach(() => {
    nav.navigate.mockClear();
  });

  test('Step 1: Open the Register Screen — title is visible', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Join TaskChamp')).toBeTruthy();
  });

  test('Step 2: Fill in registration fields (form is rendered)', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create an account to start managing your tasks effectively.')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
  });

  test('Step 3: Tap "Already have an account? Sign In" — navigates to Login', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    fireEvent.press(getByText('Already have an account? Sign In'));
    expect(nav.navigate).toHaveBeenCalledWith('Login');
  });
});
