import { Tabs, router } from "expo-router";
import { Volleyball, Box, User, Wrench } from "lucide-react-native";
import { useEffect } from "react";
import { Platform, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { normalizeBorder } from "@/constants/pixelRatio";

/**
 * Tab Layout - Main navigation for authenticated users.
 * Redirects to login if not authenticated.
 */
export default function TabLayout(): React.JSX.Element | null {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.headerBg,
        tabBarInactiveTintColor: 'rgba(42, 71, 60, 0.4)',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            {/* Corner fills - these sit behind the rounded corners */}
            <View style={styles.cornerFillLeft} />
            <View style={styles.cornerFillRight} />
            {/* Main rounded background with shadow */}
            <View style={styles.tabBarRounded} />
          </View>
        ),
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 0 : 8 + insets.bottom,
          height: Platform.OS === 'ios' ? 88 : 68 + insets.bottom,
        },
        headerStyle: {
          backgroundColor: Colors.cream,
          ...Platform.select({
            ios: {
              shadowColor: Colors.black,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            },
            android: {
              elevation: 4,
            },
            default: {},
          }),
        },
        headerTintColor: Colors.charcoal,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="projects"
        options={{
          title: t('tabs.projects'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Volleyball
              color={color}
              size={26}
              strokeWidth={focused ? 3 : 2}
            />
          ),
          tabBarAccessibilityLabel: t('tabs.projects'),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: t('tabs.inventory'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Box
              color={color}
              size={26}
              strokeWidth={focused ? 3 : 2}
            />
          ),
          tabBarAccessibilityLabel: t('tabs.inventory'),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: t('tabs.tools'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Wrench
              color={color}
              size={26}
              strokeWidth={focused ? 3 : 2}
            />
          ),
          tabBarAccessibilityLabel: t('tabs.tools'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <User
              color={color}
              size={26}
              strokeWidth={focused ? 3 : 2}
            />
          ),
          tabBarAccessibilityLabel: t('tabs.profile'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cornerFillLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    backgroundColor: Colors.white,
  },
  cornerFillRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: Colors.white,
  },
  tabBarRounded: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: normalizeBorder(1),
    borderTopColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 24,
      },
    }),
  },
});
