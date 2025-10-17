import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/auth-context';
import { useEffect } from 'react';
import { router } from 'expo-router';
import Colors from '@/constants/colors';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/projects');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: Colors.cream,
        },
        headerTintColor: Colors.charcoal,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}