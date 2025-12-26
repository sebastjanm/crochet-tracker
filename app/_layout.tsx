import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { setButtonStyleAsync } from "expo-navigation-bar";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useRef, Suspense } from "react";
import { StyleSheet, Platform, View, ActivityIndicator, AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { ProjectsProvider, useProjects } from "@/hooks/projects-context";
import { InventoryProvider, useInventory } from "@/hooks/inventory-context";
import { LanguageProvider } from "@/hooks/language-context";
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
      performSync(db, user.id)
        .then(async (result) => {
          if (result.pulled.projects > 0 || result.pulled.inventory > 0) {
            await refreshProjects();
            await refreshItems();
          }
        })
        .catch((error) => {
          console.error('[SyncManager] Initial sync failed:', error);
        });
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
          </LanguageProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}