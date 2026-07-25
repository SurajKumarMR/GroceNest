import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native';
import { LoginScreen } from '../../src/screens/LoginScreen';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const mockSignIn = jest.fn();
const mockGoogleLogin = jest.fn();
const mockVerifyMFA = jest.fn();

jest.mock('../../src/context/AuthContext', () => {
  const original = jest.requireActual('../../src/context/AuthContext');
  return {
    ...original,
    useAuth: () => ({
      signIn: mockSignIn,
      googleLogin: mockGoogleLogin,
      verifyMFA: mockVerifyMFA,
      user: null,
      loading: false,
      isAuthenticated: false,
    }),
  };
});

jest.mock('../../src/services/api', () => ({
  authApi: {
    login: jest.fn(),
    googleLogin: jest.fn(),
    forgotPassword: jest.fn(),
    verifyMFA: jest.fn(),
  },
}));

describe('LoginScreen Component Tests', () => {
  const mockNavigation = { navigate: jest.fn(), replace: jest.fn(), goBack: jest.fn() };
  const mockRoute = { params: { role: 'CUSTOMER' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockResolvedValue(undefined);
    mockGoogleLogin.mockResolvedValue(undefined);
    mockVerifyMFA.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  test('renders login form elements correctly', async () => {
    await render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByPlaceholderText('hello@example.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.getByText('Google')).toBeTruthy();
  });

  test('displays validation errors on empty submission', async () => {
    await render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    await act(async () => {
      fireEvent.press(screen.getByText('Sign In'));
    });

    expect(await screen.findByText('Email or phone is required.')).toBeTruthy();
    expect(await screen.findByText('Password is required.')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  test('calls signIn with valid input', async () => {
    await render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    const emailInput = screen.getByPlaceholderText('hello@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const signInBtn = screen.getByText('Sign In');

    await act(async () => {
      fireEvent.changeText(emailInput, 'user@example.com');
      fireEvent.changeText(passwordInput, 'password123');
    });

    await act(async () => {
      fireEvent.press(signInBtn);
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });
  });

  test('opens MFA modal when mfaRequired is returned', async () => {
    mockSignIn.mockResolvedValueOnce({
      mfaRequired: true,
      mfaToken: 'mock-mfa-token',
      userId: 'user-123',
    });

    await render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    const emailInput = screen.getByPlaceholderText('hello@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const signInBtn = screen.getByText('Sign In');

    await act(async () => {
      fireEvent.changeText(emailInput, 'mfa@example.com');
      fireEvent.changeText(passwordInput, 'password123');
    });

    await act(async () => {
      fireEvent.press(signInBtn);
    });

    expect(await screen.findByText('Two-Factor Authentication')).toBeTruthy();
    expect(screen.getByPlaceholderText('000000')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('000000'), '123456');
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Verify'));
    });

    await waitFor(() => {
      expect(mockVerifyMFA).toHaveBeenCalledWith('mock-mfa-token', '123456');
    });
  });

  test('handles Google Sign-In flow', async () => {
    await render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    await act(async () => {
      fireEvent.press(screen.getByText('Google'));
    });

    await waitFor(() => {
      expect(GoogleSignin.hasPlayServices).toHaveBeenCalled();
      expect(GoogleSignin.signIn).toHaveBeenCalled();
      expect(mockGoogleLogin).toHaveBeenCalledWith({
        googleId: 'mock-id',
        email: 'mock@example.com',
        firstName: 'Mock',
        lastName: 'User',
        role: 'CUSTOMER',
      });
    });
  });
});
