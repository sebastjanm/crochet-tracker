import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { setButtonStyleAsync } from "expo-navigation-bar";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AuthProvider,
  ProjectsProvider,
  InventoryProvider,
  LanguageProvider,
  TimeSessionsProvider,
  useLanguage,
} from "@/providers";
import { ToastProvider, useToast } from "@/components/Toast";
import { Colors } from "@/constants/colors";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://70f480ee76421814fb0e218e86714783@o4509615901507584.ingest.de.sentry.io/4510614720086096',

  // Privacy-safe: Don't collect PII (IP address, cookies, user data)
  // This aligns with App Store/Play Store privacy requirements
  sendDefaultPii: false,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay with privacy-conscious sample rates
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.25, // Reduced from 100% to 25% for privacy
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.headerBg,
  },
});

/**
 * UpdateNotifier - Checks for OTA updates and shows a toast notification.
 * Uses non-blocking Toast instead of Alert for better UX.
 * Only runs in production builds.
 */
function UpdateNotifier(): null {
  const { t } = useLanguage();
  const { showToast } = useToast();

  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) return;

      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Show non-blocking toast with tap-to-restart action
          showToast(
            t('updates.tapToRestart'),
            'info',
            8000, // 8 seconds - longer to give user time to notice
            async () => {
              await Updates.reloadAsync();
            }
          );
        }
      } catch (error) {
        if (__DEV__) console.error('[Updates] Error checking for updates:', error);
      }
    }

    checkForUpdates();
  }, [t, showToast]);

  return null;
}

/**
 * RootLayout - Root layout component with all providers.
 * Sets up navigation, auth, state management, and theme.
 */
export default Sentry.wrap(function RootLayout() {
  useEffect(() => {
    async function prepare() {
      try {
        await SystemUI.setBackgroundColorAsync(Colors.headerBg);
        if (Platform.OS === 'android') {
          await setButtonStyleAsync('dark');
        }
        // Give stores time to warm up from AsyncStorage before showing UI
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        if (__DEV__) console.warn('Error during app initialization:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.container}>
          <LanguageProvider>
            <AuthProvider>
              <ProjectsProvider>
                <InventoryProvider>
                  <TimeSessionsProvider>
                  <ToastProvider>
                    <UpdateNotifier />
                    <Stack
                        screenOptions={{
                          headerShown: false,
                        }}
                      >
                        <Stack.Screen name="index" />
                        <Stack.Screen name="onboarding" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="help" />
                        <Stack.Screen name="legal" />
                        <Stack.Screen name="about" />
                        <Stack.Screen name="project/[id]" />
                        <Stack.Screen name="video-player" />
                        <Stack.Screen name="yarnai" />
                        <Stack.Screen
                          name="add-inventory"
                          options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen
                          name="edit-inventory/[id]"
                          options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen
                          name="add-project"
                          options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen
                          name="edit-project/[id]"
                          options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen
                          name="project-inspiration/[id]"
                          options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen
                          name="project-journal/[id]"
                          options={{ presentation: 'modal' }}
                        />
                      </Stack>
                  </ToastProvider>
                  </TimeSessionsProvider>
                </InventoryProvider>
              </ProjectsProvider>
            </AuthProvider>
          </LanguageProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
});