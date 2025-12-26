import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { setButtonStyleAsync } from "expo-navigation-bar";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import * as Updates from "expo-updates";
import React, { useEffect, useRef, Suspense } from "react";
import { StyleSheet, Platform, View, ActivityIndicator, AppState, AppStateStatus, Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { ProjectsProvider, useProjects } from "@/hooks/projects-context";
import { InventoryProvider, useInventory } from "@/hooks/inventory-context";
import { LanguageProvider, useLanguage } from "@/hooks/language-context";
import { migrateDatabase } from "@/lib/database/migrations";
import { getSyncManager, cleanupSyncManager } from "@/lib/legend-state";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.headerBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.headerBg,
  },
});

/**
 * Loading fallback shown while SQLite database initializes.
 */
function DatabaseLoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.deepTeal} />
    </View>
  );
}

/**
 * Update Checker - Checks for OTA updates and prompts user to reload.
 * Only runs in production builds (not in dev mode).
 * Uses translations for multilanguage support.
 */
function UpdateChecker({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();

  useEffect(() => {
    async function checkForUpdates() {
      // Skip in development mode
      if (__DEV__) {
        console.log('[Updates] Skipping update check in dev mode');
        return;
      }

      try {
        console.log('[Updates] Checking for updates...');

        // DEBUG: Show that update check is starting
        const currentUpdateId = Updates.updateId;
        const channel = Updates.channel;
        const runtimeVersion = Updates.runtimeVersion;

        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          console.log('[Updates] Update available, downloading...');
          await Updates.fetchUpdateAsync();

          console.log('[Updates] Update downloaded, prompting user...');
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
        } else {
          console.log('[Updates] App is up to date');
          // DEBUG: Show that no update was found
          Alert.alert(
            'Update Check',
            `No update available.\n\nChannel: ${channel}\nRuntime: ${runtimeVersion}\nCurrent update: ${currentUpdateId || 'embedded'}`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('[Updates] Error checking for updates:', error);
        // DEBUG: Show error instead of silent fail
        Alert.alert(
          'Update Check Error',
          String(error),
          [{ text: 'OK' }]
        );
      }
    }

    checkForUpdates();
  }, [t]);

  return <>{children}</>;
}

/**
 * Legend-State Sync Manager - Handles background sync for Pro users.
 * Uses Legend-State for production-grade offline-first sync with Supabase.
 *
 * @see https://supabase.com/blog/local-first-expo-legend-state
 */
function LegendStateSyncManager({ children }: { children: React.ReactNode }) {
  const { user, isPro } = useAuth();
  const { refreshProjects } = useProjects();
  const { refreshItems } = useInventory();
  const appState = useRef(AppState.currentState);
  const hasInitialSynced = useRef(false);
  const syncManagerRef = useRef<ReturnType<typeof getSyncManager>>(null);

  useEffect(() => {
    // Initialize or cleanup sync manager based on Pro status
    if (isPro && user?.id) {
      // Get or create sync manager with callbacks for remote changes
      syncManagerRef.current = getSyncManager(user.id, isPro, {
        onProjectsChanged: async () => {
          console.log('[LegendStateSyncManager] Projects changed from remote, refreshing...');
          await refreshProjects();
        },
        onInventoryChanged: async () => {
          console.log('[LegendStateSyncManager] Inventory changed from remote, refreshing...');
          await refreshItems();
        },
      });

      // Initialize sync manager if not already initialized
      if (syncManagerRef.current && !hasInitialSynced.current) {
        hasInitialSynced.current = true;
        console.log('[LegendStateSyncManager] Initializing Legend-State sync for Pro user:', user.id);

        syncManagerRef.current.initialize()
          .then(() => {
            console.log('[LegendStateSyncManager] Legend-State sync initialized successfully');

            // DEBUG: Show initialization success (remove after debugging)
            if (__DEV__ === false) {
              Alert.alert(
                'Sync Initialized',
                'Legend-State offline-first sync is now active.\nChanges will sync automatically.',
                [{ text: 'OK' }]
              );
            }
          })
          .catch((error) => {
            console.error('[LegendStateSyncManager] Initialization failed:', error);
            if (__DEV__ === false) {
              Alert.alert('Sync Error', String(error), [{ text: 'OK' }]);
            }
          });
      }
    } else {
      // Cleanup sync manager when user logs out or is no longer Pro
      if (syncManagerRef.current) {
        cleanupSyncManager();
        syncManagerRef.current = null;
        hasInitialSynced.current = false;
        console.log('[LegendStateSyncManager] Cleaned up sync manager (user logged out or not Pro)');
      }
    }

    // App state listener for foreground detection
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active' &&
          isPro &&
          user?.id
        ) {
          console.log('[LegendStateSyncManager] App foregrounded, Legend-State will auto-sync');
          // Legend-State handles sync automatically via realtime subscriptions
          // No manual sync needed - just refresh contexts to pick up any changes
          await refreshProjects();
          await refreshItems();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isPro, user?.id, refreshProjects, refreshItems]);

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    async function prepare() {
      try {
        // Set root background color to prevent white flash
        await SystemUI.setBackgroundColorAsync(Colors.headerBg);

        // Configure Android navigation bar for edge-to-edge
        if (Platform.OS === 'android') {
          // Note: setBackgroundColorAsync is not supported with edge-to-edge enabled
          // Only button style can be configured in edge-to-edge mode
          await setButtonStyleAsync('dark');
        }

        // Small delay to ensure providers are mounted
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn('Error during app initialization:', error);
      } finally {
        // Hide splash screen after everything is ready
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
              <Suspense fallback={<DatabaseLoadingFallback />}>
                <SQLiteProvider
                  databaseName="artful.db"
                  onInit={migrateDatabase}
                >
                  <ProjectsProvider>
                    <InventoryProvider>
                      <LegendStateSyncManager>
                        <Stack
                          screenOptions={{
                            headerShown: false,
                          }}
                        >
                          {/* Main app routes */}
                          <Stack.Screen name="index" />
                          <Stack.Screen name="(auth)" />
                          <Stack.Screen name="(tabs)" />
                          <Stack.Screen name="help" />
                          <Stack.Screen name="legal" />
                          <Stack.Screen name="project/[id]" />
                          <Stack.Screen name="video-player" />

                          {/* YarnAI routes - nested layout handles individual screens */}
                          <Stack.Screen name="yarnai" />

                          {/* Modal routes */}
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
                      </LegendStateSyncManager>
                    </InventoryProvider>
                  </ProjectsProvider>
                </SQLiteProvider>
              </Suspense>
              </AuthProvider>
            </UpdateChecker>
          </LanguageProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}