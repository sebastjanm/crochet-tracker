import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YarnBallLogo } from '@/components/YarnBallLogo';
import { Colors } from '@/constants/colors';
import { buttonShadow } from '@/constants/pixelRatio';

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Debug logging
  if (__DEV__) console.log('[Index] State:', { showSplash, isLoading, isAuthenticated });

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide splash after 2 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim]);

  if (showSplash) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <Animated.View 
          style={[
            styles.splashContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <YarnBallLogo size={64} color={Colors.white} />
          </View>
          <Text style={styles.appName}>Crochet Tracker</Text>
          <Text style={styles.tagline}>Track your crochet projects</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

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

  if (isAuthenticated) {
    if (__DEV__) console.log('[Index] Redirecting to /projects');
    return <Redirect href="/projects" />;
  }

  if (__DEV__) console.log('[Index] Redirecting to /(auth)/login');
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
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
  logoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: Colors.warmGray,
    textAlign: 'center',
    fontWeight: '400',
  },
});