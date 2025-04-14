import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';
import type { Database } from '../../integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return profile;
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async ({ userId, updates }: {
    userId: string;
    updates: Partial<Profile>;
  }) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return profile;
  }
);

export const updateUserSettings = createAsyncThunk(
  'user/updateSettings',
  async ({ userId, theme, currency, displayPreferences, notificationPreferences }: {
    userId: string;
    theme?: string;
    currency?: string;
    displayPreferences?: Record<string, any>;
    notificationPreferences?: Record<string, any>;
  }) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        theme,
        currency,
        display_preferences: displayPreferences,
        notification_preferences: notificationPreferences,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return profile;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    logout: (state) => {
      state.profile = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { setAuthenticated, logout } = userSlice.actions;
export default userSlice.reducer; 