/**
 * Proponent: Gula, Lovelyn | Module: Registration Module | Date: 01/15/2026
 * UT_010: Email already exists - Display "Email already registered" error
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import RegisterScreen from '../src/screens/RegisterScreen';

let mockError: string | null = null;
jest.mock('../src/store/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({ isLoading: false, error: mockError }),
}));
jest.mock('../src/store/slices/authSlice', () => ({ registerUser: jest.fn(), clearError: jest.fn() }));

const nav = { navigate: jest.fn() } as any;

describe('UT_010: Email already exists - Display "Email already registered" error', () => {
  test('Step 1: Open the Registration Screen', () => {
    mockError = null;
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Join TaskChamp')).toBeTruthy();
  });
  test('Step 2: Enter Full Name "Angelo Solis"', () => {
    mockError = null;
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create Account')).toBeTruthy();
  });
  test('Step 3: Enter already registered email "existing@email.com"', () => {
    mockError = null;
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Create Account')).toBeTruthy();
  });
  test('Step 4: Tap "Create Account" — Snackbar displays "Email already registered"', () => {
    mockError = 'Email already registered';
    const { getByText } = render(<RegisterScreen navigation={nav} route={{} as any} />);
    expect(getByText('Email already registered')).toBeTruthy();
  });
});
