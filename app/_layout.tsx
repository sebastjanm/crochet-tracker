import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
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
  },
});

export default function RootLayout() {
  useEffect(() => {
    // Set root background color to prevent white flash
    SystemUI.setBackgroundColorAsync(Colors.cream);

    // Configure Android navigation bar for edge-to-edge
    if (Platform.OS === 'android') {
      // Note: setBackgroundColorAsync is not supported with edge-to-edge enabled
      // Only button style can be configured in edge-to-edge mode
      setButtonStyleAsync('dark');
    }

    SplashScreen.hideAsync();
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
                  <Slot />
                </InventoryProvider>
              </ProjectsProvider>
            </AuthProvider>
          </LanguageProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}