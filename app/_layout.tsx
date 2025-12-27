import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { setButtonStyleAsync } from "expo-navigation-bar";
import { SQLiteProvider } from "expo-sqlite";
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
import { imageSyncQueue, type ImageUploadCallbacks, clearStores } from "@/lib/legend-state";
import { ToastProvider, useToast } from "@/components/Toast";
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
        }
      } catch (error) {
        console.error('[Updates] Error checking for updates:', error);
      }
    }

    checkForUpdates();
  }, [t]);

  return <>{children}</>;
}

/**
 * Legend-State Sync Manager - Handles background sync for Pro users.
 *
 * ARCHITECTURE: SQLite + Legend-State for Cloud Sync
 * ===================================================
 * - SQLite = Source of truth for ALL users (offline-first guarantee)
 * - Legend-State = Cloud sync layer for Pro users only
 * - Image upload queue handles file uploads separately
 *
 * The contexts (projects-context, inventory-context) handle:
 * - SQLite reads/writes (always)
 * - Legend-State pushes to cloud (Pro users)
 *
 * This component handles:
 * - Image upload queue initialization
 * - App foreground refresh
 * - Cleanup on logout
 *
 * @see https://supabase.com/blog/local-first-expo-legend-state
 */
function LegendStateSyncManager({ children }: { children: React.ReactNode }) {
  const { user, isPro } = useAuth();
  const { refreshProjects, replaceProjectImage } = useProjects();
  const { refreshItems, replaceInventoryImage } = useInventory();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const appState = useRef(AppState.currentState);
  const hasInitialized = useRef(false);

  useEffect(() => {
    console.log('[SyncManager] useEffect triggered', {
      isPro,
      userId: user?.id,
      hasInitialized: hasInitialized.current,
    });

    // Initialize or cleanup based on Pro status
    if (isPro && user?.id) {
      console.log('[SyncManager] Setting up image callbacks for Pro user');

      // Create image upload callbacks
      const imageCallbacks: ImageUploadCallbacks = {
        onImageUploaded: async (itemId, itemType, _imageIndex, newUrl, oldUri) => {
          console.log(`[SyncManager] onImageUploaded callback called:`, {
            itemId,
            itemType,
            newUrl: newUrl.substring(0, 50) + '...',
            oldUri: oldUri.substring(0, 50) + '...',
          });
          if (itemType === 'project') {
            await replaceProjectImage(itemId, oldUri, newUrl);
          } else if (itemType === 'inventory') {
            await replaceInventoryImage(itemId, oldUri, newUrl);
          }
        },
        onImageFailed: (itemId, itemType, imageIndex, error) => {
          console.error(`[SyncManager] Image upload failed: ${itemType}/${itemId}[${imageIndex}]`, error);
          showToast(t('profile.imageUploadFailed'), 'error');
        },
      };

      // Initialize image sync queue OR update callbacks
      // The queue's initialize() method handles both cases:
      // - First call: Full initialization
      // - Subsequent calls: Updates callbacks only (doesn't re-initialize queue)
      // This ensures callbacks always have fresh references to context methods
      console.log('[SyncManager] Initializing/updating image sync queue for Pro user:', user.id);

      imageSyncQueue.initialize(user.id, imageCallbacks)
        .then(() => {
          if (!hasInitialized.current) {
            hasInitialized.current = true;
            console.log('[SyncManager] Image sync queue initialized successfully');
          } else {
            console.log('[SyncManager] Image sync queue callbacks updated');
          }
        })
        .catch((error) => {
          console.error('[SyncManager] Image sync queue initialization failed:', error);
        });
    } else {
      // Cleanup when user logs out or is no longer Pro
      if (hasInitialized.current) {
        clearStores(user?.id);
        hasInitialized.current = false;
        console.log('[SyncManager] Cleaned up Legend-State stores (user logged out or not Pro)');
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
          console.log('[SyncManager] App foregrounded, refreshing data');
          // Legend-State handles sync automatically via realtime subscriptions
          // Refresh contexts to pick up any changes
          await refreshProjects();
          await refreshItems();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isPro, user?.id, refreshProjects, refreshItems, replaceProjectImage, replaceInventoryImage, showToast, t]);

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
                      <ToastProvider>
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
                          <Stack.Screen name="about" />
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
                      </ToastProvider>
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