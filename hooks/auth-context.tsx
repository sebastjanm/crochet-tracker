/**
 * Supabase Auth Context
 *
 * Provides authentication via Supabase Auth with profile management.
 * - Real email/password authentication
 * - Session persistence via AsyncStorage
 * - Auto-refresh of tokens
 * - Profile sync from profiles table
 */

import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { User, UserRole } from '@/types';
import type { Session, AuthError } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPro: boolean;
  isAdmin: boolean;
}

interface LoginResult {
  user: User | null;
  error: AuthError | null;
}

interface RegisterResult {
  user: User | null;
  error: AuthError | null;
  confirmEmail: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map Supabase profile row to app User type
 */
function mapProfileToUser(
  profile: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    role?: UserRole;
  }
): User {
  const role = (profile.role as UserRole) || 'ordinary';
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar_url,
    role,
    isPro: role === 'pro' || role === 'admin',
    isAdmin: role === 'admin',
  };
}

// ============================================================================
// AUTH PROVIDER
// ============================================================================

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  // Computed role helpers
  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  /**
   * Fetch user profile from Supabase profiles table
   * Includes a 5-second timeout to prevent hanging
   */
  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    console.log('[Auth] fetchProfile starting for:', userId);
    if (!supabase) {
      console.log('[Auth] fetchProfile: supabase is null');
      return null;
    }

    try {
      console.log('[Auth] fetchProfile: querying profiles table...');

      // Add timeout to prevent hanging forever
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn('[Auth] fetchProfile: timeout after 5s');
          resolve(null);
        }, 5000);
      });

      const queryPromise = supabase
        .from('profiles')
        .select('id, email, name, avatar_url, role')
        .eq('id', userId)
        .single();

      const result = await Promise.race([queryPromise, timeoutPromise]);

      // If timeout won, result is null
      if (result === null) {
        console.warn('[Auth] fetchProfile: timed out, returning null');
        return null;
      }

      const { data: profile, error } = result;
      console.log('[Auth] fetchProfile: query complete', { profile, error: error?.message });

      if (error) {
        console.error('[Auth] Failed to fetch profile:', error.message);
        return null;
      }

      if (profile) {
        return mapProfileToUser(profile);
      }

      return null;
    } catch (err) {
      console.error('[Auth] Profile fetch error:', err);
      return null;
    }
  }, []);

  /**
   * Handle session changes (login, logout, token refresh)
   */
  const handleSessionChange = useCallback(async (newSession: Session | null) => {
    console.log('[Auth] handleSessionChange:', { hasSession: !!newSession, userId: newSession?.user?.id });
    setSession(newSession);

    if (newSession?.user) {
      console.log('[Auth] handleSessionChange: fetching profile...');
      const profile = await fetchProfile(newSession.user.id);
      console.log('[Auth] handleSessionChange: profile fetched', { hasProfile: !!profile });
      if (profile) {
        console.log('[Auth] handleSessionChange: setting user from profile');
        setUser(profile);
      } else {
        // Fallback: create user from session data if profile not found yet
        console.log('[Auth] handleSessionChange: using fallback user');
        setUser({
          id: newSession.user.id,
          email: newSession.user.email || '',
          name: newSession.user.user_metadata?.name || newSession.user.email?.split('@')[0] || 'User',
          role: 'ordinary',
          isPro: false,
          isAdmin: false,
        });
      }
    } else {
      console.log('[Auth] handleSessionChange: no session, clearing user');
      setUser(null);
    }
    console.log('[Auth] handleSessionChange: complete');
  }, [fetchProfile]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('[Auth] Supabase not configured');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // Get initial session
    const initAuth = async () => {
      console.log('[Auth] initAuth starting...');
      try {
        console.log('[Auth] initAuth: getting session...');
        const { data: { session: initialSession } } = await supabase!.auth.getSession();
        console.log('[Auth] initAuth: session retrieved', { hasSession: !!initialSession });

        if (mounted) {
          console.log('[Auth] initAuth: calling handleSessionChange...');
          await handleSessionChange(initialSession);
          console.log('[Auth] initAuth: handleSessionChange complete, setting isLoading=false');
          setIsLoading(false);
          isInitializedRef.current = true;
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
        if (mounted) {
          setIsLoading(false);
          isInitializedRef.current = true;
        }
      }
    };

    console.log('[Auth] Starting initAuth...');
    initAuth();

    // Subscribe to auth state changes
    // Skip INITIAL_SESSION and SIGNED_IN during init - initAuth handles these
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] State change:', event);

        // Skip events during initialization - initAuth handles the initial session
        if (!isInitializedRef.current && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
          console.log('[Auth] Skipping event during init:', event);
          return;
        }

        if (mounted) {
          await handleSessionChange(newSession);

          // Ensure loading is false after any auth event
          if (isLoading) {
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSessionChange]);

  /**
   * Login with email and password
   */
  const login = async (
    _name: string, // Not used for login, kept for API compatibility
    email: string,
    password: string
  ): Promise<User> => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Login failed:', error.message);
      throw error;
    }

    if (!data.user) {
      throw new Error('No user returned from login');
    }

    // Fetch profile
    const profile = await fetchProfile(data.user.id);

    if (profile) {
      setUser(profile);
      setSession(data.session);
      return profile;
    }

    // Fallback user
    const fallbackUser: User = {
      id: data.user.id,
      email: data.user.email || email,
      name: data.user.user_metadata?.name || email.split('@')[0],
      role: 'ordinary',
      isPro: false,
      isAdmin: false,
    };

    setUser(fallbackUser);
    setSession(data.session);
    return fallbackUser;
  };

  /**
   * Register new user
   */
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<User> => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // Stored in user_metadata, used by trigger
        },
      },
    });

    if (error) {
      console.error('[Auth] Registration failed:', error.message);
      throw error;
    }

    if (!data.user) {
      throw new Error('No user returned from registration');
    }

    // Note: Profile is created by database trigger (handle_new_user)
    // For immediate use, create a temporary user object
    const newUser: User = {
      id: data.user.id,
      email: data.user.email || email,
      name,
      role: 'ordinary',
      isPro: false,
      isAdmin: false,
    };

    // If session exists (email confirmation disabled), set user
    if (data.session) {
      setUser(newUser);
      setSession(data.session);
    }

    return newUser;
  };

  /**
   * Request password reset email
   */
  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'artfulspace://reset-password',
    });

    if (error) {
      console.error('[Auth] Password reset failed:', error.message);
      throw error;
    }

    return {
      success: true,
      message: 'Password reset email sent. Check your inbox.',
    };
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    if (!supabase) {
      setUser(null);
      setSession(null);
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth] Logout failed:', error.message);
      // Still clear local state even if API call fails
    }

    setUser(null);
    setSession(null);
  };

  /**
   * Update user profile
   */
  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user || !supabase) return;

    // Update profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        avatar_url: updates.avatar,
        // Note: role updates should be admin-only, not included here
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', user.id);

    if (error) {
      console.error('[Auth] Profile update failed:', error.message);
      throw error;
    }

    // Update local state
    setUser({
      ...user,
      ...updates,
    });
  };

  /**
   * Refresh user profile from database
   */
  const refreshUser = async (): Promise<void> => {
    if (!user?.id) return;

    const profile = await fetchProfile(user.id);
    if (profile) {
      setUser(profile);
      console.log('🔄 User profile refreshed from Supabase');
    }
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    isPro,
    isAdmin,
    login,
    register,
    resetPassword,
    logout,
    updateUser,
    refreshUser,
  };
});
