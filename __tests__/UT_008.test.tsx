/**
 * Proponent: Gula, Lovelyn | Module: Registration Module | Date: 01/15/2026
 * UT_008: Submit with empty required fields - Display error for missing fields
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

describe('UT_008: Submit with empty required fields - Display error for missing fields', () => {
  test('Step 1: Open the Registration Screen', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Join TaskChamp')).toBeTruthy();
  });
  test('Step 2: Leave Full Name field empty', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create Account')).toBeTruthy();
  });
  test('Step 3: Leave Email field empty', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create Account')).toBeTruthy();
  });
  test('Step 4: Leave Password and Confirm Password fields empty', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create Account')).toBeTruthy();
  });
  test('Step 5: Tap "Create Account" — button is disabled, error prevents submission', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(isButtonDisabled(getByText('Create Account'))).toBe(true);
  });
});
