import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../../types';

// Mock API calls - replace with real API later
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful login
    if (email && password) {
      const user: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=2E3A59&color=fff`
      };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return user;
    }
    throw new Error('Invalid credentials');
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password, name }: { email: string; password: string; name: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user: User = {
      id: Date.now().toString(),
      email,
      name,
      avatar: `https://ui-avatars.com/api/?name=${name}&background=2E3A59&color=fff`
    };
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
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
