/**
 * Proponent: Gula, Lovelyn | Module: Login Module | Date: 01/15/2026
 * UT_006: Empty new password field - Display validation error
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import PasswordResetScreen from '../src/screens/PasswordResetScreen';
import { isButtonDisabled } from './helpers';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({ isLoading: false, error: null }),
}));
jest.mock('../src/store/slices/authSlice', () => ({ resetPassword: jest.fn(), clearError: jest.fn() }));

const nav = { navigate: jest.fn() } as any;

describe('UT_006: Empty new password field - Display validation error', () => {
  test('Step 1: Open the Reset Password screen', () => {
    const { getByText } = render(<PasswordResetScreen navigation={nav} route={{} as any} />);
    expect(getByText('Reset Password')).toBeTruthy();
  });
  test('Step 2: Leave email field empty', () => {
    const { getByText } = render(<PasswordResetScreen navigation={nav} route={{} as any} />);
    expect(getByText('Send Reset Link')).toBeTruthy();
  });
  test('Step 3: Tap "Send Reset Link" — button is disabled, validation prevents submission', () => {
    const { getByText } = render(<PasswordResetScreen navigation={nav} route={{} as any} />);
    expect(isButtonDisabled(getByText('Send Reset Link'))).toBe(true);
  });
});
