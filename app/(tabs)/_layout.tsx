import { Tabs, router } from "expo-router";
import { Volleyball, Box, User, Wrench } from "lucide-react-native";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/hooks/auth-context";
import { useLanguage } from "@/hooks/language-context";
import { normalizeBorder } from "@/constants/pixelRatio";

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.deepTeal,
        tabBarInactiveTintColor: Colors.warmGray,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: normalizeBorder(1),
          ...Platform.select({
            ios: {
              shadowColor: Colors.black,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
            default: {},
          }),
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
              color={focused ? Colors.deepTeal : Colors.warmGray} 
              size={26} 
              strokeWidth={focused ? 3 : 2}
            />
          ),
          tabBarAccessibilityLabel: t('tabs.projects'),
          tabBarItemStyle: {
            paddingVertical: 2,
          },
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: t('tabs.inventory'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Box
              color={focused ? Colors.deepTeal : Colors.warmGray}
              size={26}
              strokeWidth={focused ? 3 : 2}
            />
          ),
          tabBarAccessibilityLabel: t('tabs.inventory'),
          tabBarItemStyle: {
            paddingVertical: 2,
          },
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: t('tabs.tools'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Wrench
              color={focused ? Colors.deepTeal : Colors.warmGray}
              size={26}
              strokeWidth={focused ? 3 : 2}
            />
          ),
          tabBarAccessibilityLabel: t('tabs.tools'),
          tabBarItemStyle: {
            paddingVertical: 2,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <User
              color={focused ? Colors.deepTeal : Colors.warmGray}
              size={26}
              strokeWidth={focused ? 3 : 2}
            />
          ),
          tabBarAccessibilityLabel: t('tabs.profile'),
          tabBarItemStyle: {
            paddingVertical: 2,
          },
        }}
      />
    </Tabs>
  );
}
