import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { YarnBallLogo } from '@/components/YarnBallLogo';
import { Colors } from '@/constants/colors';
import { buttonShadow } from '@/constants/pixelRatio';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for DEV testing
import { hasSeenOnboarding, resetOnboarding } from './onboarding';

// Keep native splash visible until we're ready
SplashScreen.preventAutoHideAsync();

// Configure native splash fade animation
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    async function checkOnboarding() {
      try {
        // DEV: Uncomment next line to reset onboarding and see it again
        // await resetOnboarding();

        const seen = await hasSeenOnboarding();
        if (__DEV__) console.log('[Index] hasSeenOnboarding:', seen);
        setShowOnboarding(!seen);
      } catch (error) {
        if (__DEV__) console.error('[Index] Failed to check onboarding:', error);
        setShowOnboarding(false);
      } finally {
        setCheckingOnboarding(false);
        SplashScreen.hide();
      }
    }
    checkOnboarding();
  }, []);

  // Debug logging
  if (__DEV__) console.log('[Index] State:', { checkingOnboarding, showOnboarding, isLoading, isAuthenticated });

  // Still checking onboarding status (native splash is visible)
  if (checkingOnboarding) {
    return <View style={styles.loadingContainer} />;
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    if (__DEV__) console.log('[Index] Redirecting to /onboarding');
    return <Redirect href="/onboarding" />;
  }

  // Show loading while auth is being determined
  if (isLoading) {
    if (__DEV__) console.log('[Index] Showing loading screen (isLoading=true)');
    return (
      <SafeAreaView style={styles.splashContainer}>
        <View style={styles.logoContainer}>
          <YarnBallLogo size={64} color={Colors.white} />
        </View>
        <Text style={styles.appName}>Crochet Tracker</Text>
      </SafeAreaView>
    );
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    if (__DEV__) console.log('[Index] Redirecting to /projects');
    return <Redirect href="/projects" />;
  }

  if (__DEV__) console.log('[Index] Redirecting to /(auth)/login');
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#E891A0', // Match splash screen background
  },
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.sage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
});