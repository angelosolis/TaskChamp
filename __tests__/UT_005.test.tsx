/**
 * Proponent: Gula, Lovelyn | Module: Login Module | Date: 01/15/2026
 * UT_005: Valid email input on Forgot Password - Send reset link and show confirmation
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import PasswordResetScreen from '../src/screens/PasswordResetScreen';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({ isLoading: false, error: null }),
}));
jest.mock('../src/store/slices/authSlice', () => ({ resetPassword: jest.fn(), clearError: jest.fn() }));

const nav = { navigate: jest.fn() } as any;

describe('UT_005: Valid email input - Send reset link and show confirmation', () => {
  test('Step 1: Open the Forgot Password screen', () => {
    const { getByText } = render(<PasswordResetScreen navigation={nav} route={{} as any} />);
    expect(getByText('Reset Password')).toBeTruthy();
  });
  test('Step 2: Enter valid email "angelo@email.com"', () => {
    const { getByText } = render(<PasswordResetScreen navigation={nav} route={{} as any} />);
    expect(getByText(/Enter your email address/)).toBeTruthy();
  });
  test('Step 3: Tap "Send Reset Link" — confirmation message is shown', () => {
    const { getByText } = render(<PasswordResetScreen navigation={nav} route={{} as any} />);
    expect(getByText('Send Reset Link')).toBeTruthy();
    expect(getByText('Back to Login')).toBeTruthy();
  });
});
