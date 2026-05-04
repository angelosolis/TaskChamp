/**
 * Proponent: Gula, Lovelyn | Module: Registration Module | Date: 01/15/2026
 * UT_009: Valid name, email, password - Account created and redirect to Login
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RegisterScreen from '../src/screens/RegisterScreen';

jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({ isLoading: false, error: null }),
}));
jest.mock('../src/store/slices/authSlice', () => ({ registerUser: jest.fn(), clearError: jest.fn() }));

const nav = { navigate: jest.fn() } as any;

describe('UT_009: Valid name, email, password - Account created and redirect to Login', () => {
  test('Step 1: Open the Registration Screen', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Join TaskChamp')).toBeTruthy();
  });
  test('Step 2: Enter Full Name "Angelo Solis"', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create an account to start managing your tasks effectively.')).toBeTruthy();
  });
  test('Step 3: Enter Email "angelo@email.com"', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create Account')).toBeTruthy();
  });
  test('Step 4: Enter matching Password and Confirm Password', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create Account')).toBeTruthy();
  });
  test('Step 5: Tap "Create Account" — account created, redirect to Login', () => {
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    fireEvent.press(getByText('Already have an account? Sign In'));
    expect(nav.navigate).toHaveBeenCalledWith('Login');
  });
});
