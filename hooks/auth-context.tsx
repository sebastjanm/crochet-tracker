import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { User, UserRole } from '@/types';

/**
 * Migrate legacy user data to include role field
 */
function migrateUserData(userData: Partial<User>): User {
  // If user already has role, return as-is with computed fields
  if (userData.role) {
    return {
      ...userData,
      isPro: userData.role === 'pro' || userData.role === 'admin',
      isAdmin: userData.role === 'admin',
    } as User;
  }

  // Migrate from legacy isPro field
  const role: UserRole = userData.isPro ? 'pro' : 'ordinary';

  return {
    ...userData,
    role,
    isPro: role === 'pro',
    isAdmin: false,
  } as User;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Computed role helpers
  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          const migrated = migrateUserData(parsed);
          setUser(migrated);

          // Save migrated data if it changed
          if (!parsed.role) {
            await AsyncStorage.setItem('user', JSON.stringify(migrated));
          }
        } catch (parseError) {
          console.error('Failed to parse user data, resetting:', parseError);
          await AsyncStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (name: string, email: string, password: string) => {
    // Test users with predefined roles (matches Supabase seed data)
    const testUsers: Record<string, { id: string; role: UserRole }> = {
      'sebastjan@lecturehub.com': { id: 'admin-sebastjan-001', role: 'admin' },
      'pro@pro.com': { id: 'pro-user-001', role: 'pro' },
      'test@test.com': { id: 'ordinary-user-001', role: 'ordinary' },
    };

    const testUser = testUsers[email.toLowerCase()];
    const role: UserRole = testUser?.role ?? 'ordinary';
    const id = testUser?.id ?? '1';

    const mockUser: User = {
      id,
      name,
      email,
      role,
      isPro: role === 'pro' || role === 'admin',
      isAdmin: role === 'admin',
    };

    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  };

  const register = async (name: string, email: string, password: string) => {
    // Simple mock registration - in production, this would call an API
    const mockUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role: 'ordinary', // Default role
      isPro: false,
      isAdmin: false,
    };

    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  };

  const resetPassword = async (email: string) => {
    // Simple mock password reset - in production, this would call an API
    // For now, just simulate a successful reset
    return { success: true, message: 'Password reset email sent' };
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Refresh user from AsyncStorage (for dev tools / mock data reload)
  const refreshUser = async () => {
    await loadUser();
    console.log('🔄 User refreshed from AsyncStorage');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isPro,    // true if role is 'pro' or 'admin'
    isAdmin,  // true if role is 'admin'
    login,
    register,
    resetPassword,
    logout,
    updateUser,
    refreshUser,
  };
});