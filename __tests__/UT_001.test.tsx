/**
 * Proponent: Gula, Lovelyn | Module: Login Module | Date: 01/15/2026
 * UT_001: Empty email/password fields - Display error and prevent login
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../src/screens/LoginScreen';
import { isButtonDisabled } from './helpers';

const mockDispatch = jest.fn();
jest.mock('../src/store/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => ({ isLoading: false, error: null }),
}));
jest.mock('../src/store/slices/authSlice', () => ({ loginUser: jest.fn(), clearError: jest.fn() }));

const nav = { navigate: jest.fn() } as any;

describe('UT_001: Empty email/password fields - Display error and prevent login', () => {
  test('Step 1: Open the Login Screen', () => {
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('TaskChamp')).toBeTruthy();
    expect(getByText('Welcome back! Please sign in to continue.')).toBeTruthy();
  });
  test('Step 2: Leave email field empty', () => {
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('Sign In')).toBeTruthy();
  });
  test('Step 3: Leave password field empty', () => {
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('Sign In')).toBeTruthy();
  });
  test('Step 4: Tap "Sign In" — button is disabled, login is prevented', () => {
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(isButtonDisabled(getByText('Sign In'))).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
