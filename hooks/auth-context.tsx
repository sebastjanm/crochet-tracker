import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { User } from '@/types';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (parseError) {
          console.error('Failed to parse user data, resetting:', parseError);
          // Clear corrupted data and start fresh
          await AsyncStorage.removeItem('user');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (name: string, email: string, password: string) => {
    // Simple mock login - in production, this would call an API
    const mockUser: User = {
      id: '1',
      name,
      email,
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

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    resetPassword,
    logout,
  };
});