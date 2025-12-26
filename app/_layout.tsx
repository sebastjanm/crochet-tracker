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
import { performSync } from "@/lib/cloud-sync";
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
 * Cloud Sync Manager - Handles background sync for Pro users.
 * Syncs data when app comes to foreground.
 */
function SyncManager({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const { user, isPro } = useAuth();
  const { refreshProjects } = useProjects();
  const { refreshItems } = useInventory();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        // Only sync when app comes to foreground and user is Pro
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active' &&
          isPro &&
          user?.id
        ) {
          console.log('[SyncManager] App foregrounded, syncing for Pro user...');
          try {
            const result = await performSync(db, user.id);
            if (result.pulled.projects > 0 || result.pulled.inventory > 0) {
              // Refresh local state if new data was pulled from cloud
              await refreshProjects();
              await refreshItems();
              console.log('[SyncManager] Refreshed local state after cloud sync');
            }
          } catch (error) {
            console.error('[SyncManager] Foreground sync failed:', error);
          }
        }
        appState.current = nextAppState;
      }
    );

    // Initial sync on mount for Pro users
    if (isPro && user?.id) {
      console.log('[SyncManager] Initial sync starting for Pro user:', user.id, 'role:', user.role);
      performSync(db, user.id)
        .then(async (result) => {
          console.log('[SyncManager] Initial sync result:', result);

          // DEBUG: Show sync result in alert (remove after debugging)
          if (__DEV__ === false) {
            Alert.alert(
              'Sync Debug',
              `Pulled: ${result.pulled.projects} projects, ${result.pulled.inventory} inventory\n` +
              `Pushed: ${result.pushed.projects} projects, ${result.pushed.inventory} inventory\n` +
              `Errors: ${result.errors.length > 0 ? result.errors.join(', ') : 'none'}`,
              [{ text: 'OK' }]
            );
          }

          if (result.pulled.projects > 0 || result.pulled.inventory > 0) {
            await refreshProjects();
            await refreshItems();
            console.log('[SyncManager] Refreshed contexts after pull');
          }
        })
        .catch((error) => {
          console.error('[SyncManager] Initial sync failed:', error);
          // DEBUG: Show error in alert (remove after debugging)
          if (__DEV__ === false) {
            Alert.alert('Sync Error', String(error), [{ text: 'OK' }]);
          }
        });
    } else {
      console.log('[SyncManager] Skipping sync - isPro:', isPro, 'userId:', user?.id, 'role:', user?.role);
      // DEBUG: Show why sync was skipped (remove after debugging)
      if (__DEV__ === false && user) {
        Alert.alert(
          'Sync Skipped',
          `isPro: ${isPro}\nuserId: ${user?.id}\nrole: ${user?.role}`,
          [{ text: 'OK' }]
        );
      }
    }

    return () => subscription.remove();
  }, [db, isPro, user?.id, refreshProjects, refreshItems]);

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
                      <SyncManager>
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
                      </SyncManager>
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