
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  currency: string;
  theme: 'dark' | 'light';
  notificationPreferences: {
    priceAlerts: boolean;
    newsAlerts: boolean;
  };
  displayPreferences: {
    decimalPlaces: number;
    showPercentages: boolean;
  };
}

// Get current user session
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('Error in getCurrentSession:', error);
    return null;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

// Get user profile
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    
    if (authError || !auth.user) {
      console.error('Error getting authenticated user:', authError);
      return null;
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', auth.user.id)
      .single();
    
    if (profileError) {
      console.error('Error getting user profile:', profileError);
      return null;
    }
    
    return {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      avatarUrl: profile.avatar_url,
      currency: profile.currency || 'USD',
      theme: profile.theme || 'dark',
      notificationPreferences: profile.notification_preferences || {
        priceAlerts: true,
        newsAlerts: false
      },
      displayPreferences: profile.display_preferences || {
        decimalPlaces: 2,
        showPercentages: true
      }
    };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (
  updates: Partial<UserProfile>
): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: updates.firstName,
        last_name: updates.lastName,
        avatar_url: updates.avatarUrl,
        currency: updates.currency,
        theme: updates.theme,
        notification_preferences: updates.notificationPreferences,
        display_preferences: updates.displayPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return false;
  }
};

// Sign in user
export const signIn = async (
  email: string,
  password: string
): Promise<{ success: boolean, error?: string }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in signIn:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Sign up user
export const signUp = async (
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<{ success: boolean, error?: string }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in signUp:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Sign out user
export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in signOut:', error);
    return false;
  }
};
