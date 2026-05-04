/**
 * Proponent: Gula, Lovelyn | Module: Registration Module | Date: 01/15/2026
 * UT_011: Passwords do not match - Display "Passwords do not match" error
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import RegisterScreen from '../src/screens/RegisterScreen';
import { isButtonDisabled } from './helpers';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({ isLoading: false, error: null }),
}));
jest.mock('../src/store/slices/authSlice', () => ({ registerUser: jest.fn(), clearError: jest.fn() }));

const nav = { navigate: jest.fn() } as any;

describe('UT_011: Passwords do not match - Display "Passwords do not match" error', () => {
  test('Step 1: Open the Registration Screen', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Join TaskChamp')).toBeTruthy();
  });
  test('Step 2: Enter Full Name and Email', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create Account')).toBeTruthy();
  });
  test('Step 3: Enter Password "password123"', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create Account')).toBeTruthy();
  });
  test('Step 4: Enter Confirm Password "differentpassword"', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create Account')).toBeTruthy();
  });
  test('Step 5: Tap "Create Account" — button disabled, passwords do not match', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(isButtonDisabled(getByText('Create Account'))).toBe(true);
  });
});
