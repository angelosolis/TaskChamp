import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../../types';
import { supabase } from '../../services/supabase';
import { ProfileRow } from '../../types/database';

const profileToUser = (profile: ProfileRow): User => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  avatar:
    profile.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2E3A59&color=fff`,
  course: profile.course || undefined,
  educationLevel: profile.education_level || undefined,
  role: profile.role,
});

async function fetchProfile(userId: string): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) throw new Error(error?.message || 'Profile not found.');
  return profileToUser(data as ProfileRow);
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) throw new Error('Email and password are required.');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed.');

    return await fetchProfile(data.user.id);
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({
    email,
    password,
    name,
    course,
    educationLevel,
  }: {
    email: string;
    password: string;
    name: string;
    course?: string;
    educationLevel?: string;
  }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail.includes('@')) throw new Error('Please enter a valid email.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
    if (!cleanName) throw new Error('Name is required.');

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: cleanName,
          course: course || null,
          education_level: educationLevel || null,
          role: 'student',
        },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed.');

    // The on_auth_user_created trigger inserts the profile row.
    // If email confirmation is OFF, session is active and we can fetch immediately.
    // If ON, the user must confirm before signing in — handle either case.
    if (data.session) {
      try {
        return await fetchProfile(data.user.id);
      } catch {
        // Profile may not be propagated yet; fall back to a synthetic user.
      }
    }

    return {
      id: data.user.id,
      email: cleanEmail,
      name: cleanName,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2E3A59&color=fff`,
      course,
      educationLevel,
      role: 'student' as const,
    };
  }
);

export const loadUser = createAsyncThunk('auth/loadUser', async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (!data.session?.user) throw new Error('No active session.');
  return await fetchProfile(data.session.user.id);
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await supabase.auth.signOut();
});

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ email }: { email: string }) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) throw new Error('Please enter a valid email address.');

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) throw new Error(error.message);
    return { email: cleanEmail };
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (changes: { name?: string; course?: string; educationLevel?: string }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) throw new Error('Not signed in.');

    const updates: Record<string, unknown> = {};
    if (changes.name !== undefined) updates.name = changes.name.trim();
    if (changes.course !== undefined) updates.course = changes.course || null;
    if (changes.educationLevel !== undefined) updates.education_level = changes.educationLevel || null;

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw new Error(error.message);

    return await fetchProfile(userId);
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
    setUserFromSession: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
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

    builder.addCase(loadUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(loadUser.rejected, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });

    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });

    builder.addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to update profile.';
    });

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

export const { clearError, setUserFromSession } = authSlice.actions;
export default authSlice.reducer;
