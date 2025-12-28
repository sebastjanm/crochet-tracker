import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/hooks/auth-context';
import Colors from '@/constants/colors';

/**
 * AuthLayout - Stack navigator for authentication screens.
 * Redirects authenticated users to the main app.
 */
export default function AuthLayout(): React.JSX.Element {
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