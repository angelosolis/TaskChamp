import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../../types';

const CREDENTIALS_KEY = 'user_credentials';

type CredentialEntry = { user: User; password: string };
type CredentialsMap = Record<string, CredentialEntry>;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function readCredentials(): Promise<CredentialsMap> {
  const raw = await AsyncStorage.getItem(CREDENTIALS_KEY);
  return raw ? (JSON.parse(raw) as CredentialsMap) : {};
}

async function writeCredentials(map: CredentialsMap): Promise<void> {
  await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(map));
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !password) {
      throw new Error('Email and password are required.');
    }

    const credentials = await readCredentials();
    const entry = credentials[cleanEmail];

    if (!entry) {
      throw new Error('No account found for this email.');
    }
    if (entry.password !== password) {
      throw new Error('Incorrect password.');
    }

    await AsyncStorage.setItem('user', JSON.stringify(entry.user));
    return entry.user;
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password, name }: { email: string; password: string; name: string }) => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const cleanEmail = normalizeEmail(email);
    const cleanName = name.trim();

    if (!cleanEmail.includes('@')) throw new Error('Please enter a valid email.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
    if (!cleanName) throw new Error('Name is required.');

    const credentials = await readCredentials();
    if (credentials[cleanEmail]) {
      throw new Error('An account with this email already exists.');
    }

    const user: User = {
      id: Date.now().toString(),
      email: cleanEmail,
      name: cleanName,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2E3A59&color=fff`,
    };

    credentials[cleanEmail] = { user, password };
    await writeCredentials(credentials);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  }
);

export const loadUser = createAsyncThunk('auth/loadUser', async () => {
  const userData = await AsyncStorage.getItem('user');
  if (userData) {
    return JSON.parse(userData) as User;
  }
  throw new Error('No user found');
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.removeItem('user');
});

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ email }: { email: string }) => {
    // Simulate sending reset email
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!email.includes('@')) throw new Error('Please enter a valid email address.');
    // In production, call your backend API here
    return { email };
  }
);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Login failed';
    });

    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Registration failed';
    });

    // Load user
    builder.addCase(loadUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });

    // Password Reset
    builder.addCase(resetPassword.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(resetPassword.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(resetPassword.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to send reset email.';
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
