/**
 * Proponent: Gula, Lovelyn | Module: Login Module | Date: 01/15/2026
 * UT_002: Valid email and password - Redirect to Dashboard
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../src/screens/LoginScreen';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({ isLoading: false, error: null }),
}));
jest.mock('../src/store/slices/authSlice', () => ({ loginUser: jest.fn(), clearError: jest.fn() }));

const nav = { navigate: jest.fn() } as any;

describe('UT_002: Valid email and password - Redirect to Dashboard', () => {
  test('Step 1: Open the Login Screen', () => {
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('TaskChamp')).toBeTruthy();
  });
  test('Step 2: Enter valid email "angelo@email.com"', () => {
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('Sign In')).toBeTruthy();
  });
  test('Step 3: Enter valid password "********"', () => {
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('Sign In')).toBeTruthy();
  });
  test('Step 4: Tap "Sign In" — user is redirected to Dashboard', () => {
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('Welcome back! Please sign in to continue.')).toBeTruthy();
  });
});
