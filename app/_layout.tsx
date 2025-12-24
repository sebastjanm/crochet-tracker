import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { setButtonStyleAsync } from "expo-navigation-bar";
import React, { useEffect } from "react";
import { StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/hooks/auth-context";
import { ProjectsProvider } from "@/hooks/projects-context";
import { InventoryProvider } from "@/hooks/inventory-context";
import { LanguageProvider } from "@/hooks/language-context";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.headerBg,
  },
});

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
              <ProjectsProvider>
                <InventoryProvider>
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

                    {/* YarnAI routes */}
                    <Stack.Screen name="yarnai/chat" />
                    <Stack.Screen name="yarnai/ideas" />
                    <Stack.Screen name="yarnai/image-generator" />
                    <Stack.Screen name="yarnai/voice" />

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
                </InventoryProvider>
              </ProjectsProvider>
            </AuthProvider>
          </LanguageProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}