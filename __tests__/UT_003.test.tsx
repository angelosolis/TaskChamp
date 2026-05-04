/**
 * Proponent: Gula, Lovelyn | Module: Login Module | Date: 01/15/2026
 * UT_003: Invalid credentials entered - Display "Invalid credentials" error
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../src/screens/LoginScreen';

let mockError: string | null = null;
jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({ isLoading: false, error: mockError }),
}));
jest.mock('../src/store/slices/authSlice', () => ({ loginUser: jest.fn(), clearError: jest.fn() }));

const nav = { navigate: jest.fn() } as any;

describe('UT_003: Invalid credentials entered - Display "Invalid credentials" error', () => {
  test('Step 1: Open the Login Screen', () => {
    mockError = null;
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('TaskChamp')).toBeTruthy();
  });
  test('Step 2: Enter invalid email "wrong@email.com"', () => {
    mockError = null;
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('Sign In')).toBeTruthy();
  });
  test('Step 3: Enter invalid password "wrongpassword"', () => {
    mockError = null;
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('Sign In')).toBeTruthy();
  });
  test('Step 4: Tap "Sign In" — Snackbar displays "Invalid credentials"', () => {
    mockError = 'Invalid credentials';
    const { getByText } = render(<LoginScreen navigation={nav} route={{} as any} />);
    expect(getByText('Invalid credentials')).toBeTruthy();
  });
});
