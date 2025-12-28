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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { User, UserRole } from '@/types';
import type { Session } from '@supabase/supabase-js';

// Cache key for persisting user profile locally
const USER_CACHE_KEY = 'cached_user_profile';

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

/**
 * Save user profile to local cache for persistence across app restarts
 */
async function cacheUserProfile(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    if (__DEV__) console.log('[Auth] User profile cached locally');
  } catch (error) {
    if (__DEV__) console.error('[Auth] Failed to cache user profile:', error);
  }
}

/**
 * Load user profile from local cache
 */
async function loadCachedUserProfile(): Promise<User | null> {
  try {
    const cached = await AsyncStorage.getItem(USER_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    if (__DEV__) console.error('[Auth] Failed to load cached profile:', error);
  }
  return null;
}

/**
 * Clear cached user profile on logout
 */
async function clearUserCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_CACHE_KEY);
    if (__DEV__) console.log('[Auth] User cache cleared');
  } catch (error) {
    if (__DEV__) console.error('[Auth] Failed to clear user cache:', error);
  }
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
    if (__DEV__) console.log('[Auth] fetchProfile starting for:', userId);
    if (!supabase) {
      if (__DEV__) console.log('[Auth] fetchProfile: supabase is null');
      return null;
    }

    try {
      if (__DEV__) console.log('[Auth] fetchProfile: querying profiles table...');

      // Add timeout to prevent hanging forever
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          if (__DEV__) console.warn('[Auth] fetchProfile: timeout after 5s');
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
        if (__DEV__) console.warn('[Auth] fetchProfile: timed out, returning null');
        return null;
      }

      const { data: profile, error } = result;
      if (__DEV__) console.log('[Auth] fetchProfile: query complete', { profile, error: error?.message });

      if (error) {
        if (__DEV__) console.error('[Auth] Failed to fetch profile:', error.message);
        return null;
      }

      if (profile) {
        return mapProfileToUser(profile);
      }

      return null;
    } catch (err) {
      if (__DEV__) console.error('[Auth] Profile fetch error:', err);
      return null;
    }
  }, []);

  /**
   * Handle session changes (login, logout, token refresh)
   * Uses local cache for immediate user state, then refreshes from Supabase
   */
  const handleSessionChange = useCallback(async (newSession: Session | null) => {
    if (__DEV__) console.log('[Auth] handleSessionChange:', { hasSession: !!newSession, userId: newSession?.user?.id });
    setSession(newSession);

    if (newSession?.user) {
      // First, try to load cached profile for immediate UI
      const cachedUser = await loadCachedUserProfile();
      if (cachedUser && cachedUser.id === newSession.user.id) {
        if (__DEV__) console.log('[Auth] Using cached user profile (isPro:', cachedUser.isPro, ')');
        setUser(cachedUser);
      }

      // Then fetch fresh profile from Supabase (in background if we have cache)
      if (__DEV__) console.log('[Auth] handleSessionChange: fetching fresh profile...');
      const profile = await fetchProfile(newSession.user.id);
      if (__DEV__) console.log('[Auth] handleSessionChange: profile fetched', { hasProfile: !!profile });

      if (profile) {
        if (__DEV__) console.log('[Auth] handleSessionChange: setting user from profile');
        setUser(profile);
        await cacheUserProfile(profile); // Cache for next time
      } else if (!cachedUser) {
        // Only use fallback if no cached user AND no profile from server
        if (__DEV__) console.log('[Auth] handleSessionChange: using fallback user (no cache, no profile)');
        setUser({
          id: newSession.user.id,
          email: newSession.user.email || '',
          name: newSession.user.user_metadata?.name || newSession.user.email?.split('@')[0] || 'User',
          role: 'ordinary',
          isPro: false,
          isAdmin: false,
        });
      }
      // If we have cached user but fetch failed, keep using cached user (already set above)
    } else {
      if (__DEV__) console.log('[Auth] handleSessionChange: no session, clearing user');
      setUser(null);
      await clearUserCache(); // Clear cache on logout
    }
    if (__DEV__) console.log('[Auth] handleSessionChange: complete');
  }, [fetchProfile]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      if (__DEV__) console.log('[Auth] Supabase not configured');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // Get initial session
    const initAuth = async () => {
      if (__DEV__) console.log('[Auth] initAuth starting...');
      try {
        if (__DEV__) console.log('[Auth] initAuth: getting session...');
        const { data: { session: initialSession } } = await supabase!.auth.getSession();
        if (__DEV__) console.log('[Auth] initAuth: session retrieved', { hasSession: !!initialSession });

        if (mounted) {
          if (__DEV__) console.log('[Auth] initAuth: calling handleSessionChange...');
          await handleSessionChange(initialSession);
          if (__DEV__) console.log('[Auth] initAuth: handleSessionChange complete, setting isLoading=false');
          setIsLoading(false);
          isInitializedRef.current = true;
        }
      } catch (error) {
        if (__DEV__) console.error('[Auth] Init error:', error);
        if (mounted) {
          setIsLoading(false);
          isInitializedRef.current = true;
        }
      }
    };

    if (__DEV__) console.log('[Auth] Starting initAuth...');
    initAuth();

    // Subscribe to auth state changes
    // Skip INITIAL_SESSION and SIGNED_IN during init - initAuth handles these
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, newSession) => {
        if (__DEV__) console.log('[Auth] State change:', event);

        // Skip events during initialization - initAuth handles the initial session
        if (!isInitializedRef.current && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
          if (__DEV__) console.log('[Auth] Skipping event during init:', event);
          return;
        }

        if (mounted) {
          await handleSessionChange(newSession);
          // Ensure loading is false after any auth event
          setIsLoading(false);
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
      if (__DEV__) console.error('[Auth] Login failed:', error.message);
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
      await cacheUserProfile(profile); // Cache on login
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
    await cacheUserProfile(fallbackUser); // Cache fallback too
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
      if (__DEV__) console.error('[Auth] Registration failed:', error.message);
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
      if (__DEV__) console.error('[Auth] Password reset failed:', error.message);
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
      await clearUserCache();
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      if (__DEV__) console.error('[Auth] Logout failed:', error.message);
      // Still clear local state even if API call fails
    }

    setUser(null);
    setSession(null);
    await clearUserCache();
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
      if (__DEV__) console.error('[Auth] Profile update failed:', error.message);
      throw error;
    }

    // Update local state and cache
    const updatedUser = {
      ...user,
      ...updates,
    };
    setUser(updatedUser);
    await cacheUserProfile(updatedUser);
  };

  /**
   * Refresh user profile from database
   */
  const refreshUser = async (): Promise<void> => {
    if (!user?.id) return;

    const profile = await fetchProfile(user.id);
    if (profile) {
      setUser(profile);
      await cacheUserProfile(profile);
      if (__DEV__) console.log('🔄 User profile refreshed from Supabase');
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
