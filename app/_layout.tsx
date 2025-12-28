import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { setButtonStyleAsync } from "expo-navigation-bar";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { StyleSheet, Platform, Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AuthProvider,
  ProjectsProvider,
  InventoryProvider,
  LanguageProvider,
  useLanguage,
} from "@/providers";
import { ToastProvider } from "@/components/Toast";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.headerBg,
  },
});

/**
 * UpdateChecker - Checks for OTA updates and prompts user to restart.
 * Only runs in production builds.
 */
function UpdateChecker({ children }: { children: ReactNode }): React.JSX.Element {
  const { t } = useLanguage();

  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) return;

      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            t('updates.title'),
            t('updates.message'),
            [
              { text: t('updates.later'), style: 'cancel' },
              {
                text: t('updates.restart'),
                onPress: async () => {
                  await Updates.reloadAsync();
                }
              },
            ]
          );
        }
      } catch (error) {
        if (__DEV__) console.error('[Updates] Error checking for updates:', error);
      }
    }

    checkForUpdates();
  }, [t]);

  return <>{children}</>;
}

/**
 * RootLayout - Root layout component with all providers.
 * Sets up navigation, auth, state management, and theme.
 */
export default function RootLayout(): React.JSX.Element {
  useEffect(() => {
    async function prepare() {
      try {
        await SystemUI.setBackgroundColorAsync(Colors.headerBg);
        if (Platform.OS === 'android') {
          await setButtonStyleAsync('dark');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
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
      <StatusBar style="auto" />
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.container}>
          <LanguageProvider>
            <UpdateChecker>
              <AuthProvider>
                <ProjectsProvider>
                  <InventoryProvider>
                    <ToastProvider>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                        }}
                      >
                        <Stack.Screen name="index" />
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
                      </Stack>
                    </ToastProvider>
                  </InventoryProvider>
                </ProjectsProvider>
              </AuthProvider>
            </UpdateChecker>
          </LanguageProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
