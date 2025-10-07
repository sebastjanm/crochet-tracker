import { Tabs, router } from "expo-router";
import { Volleyball, Box, User, HelpCircle, Sparkles } from "lucide-react-native";
import React, { useEffect } from "react";
import { Platform, Text, TouchableOpacity, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/auth-context";
import { useLanguage } from "@/hooks/language-context";


const styles = StyleSheet.create({
  helpButton: {
    marginRight: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.cream,
  },
});

// We'll handle the custom header in the projects screen itself

function ProjectsHeaderRight() {
  return (
    <TouchableOpacity 
      onPress={() => router.push('/help')}
      style={styles.helpButton}
      activeOpacity={0.7}
    >
      <HelpCircle size={28} color={Colors.deepSage} strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

function InventoryHeaderRight() {
  return (
    <TouchableOpacity 
      onPress={() => router.push('/help')}
      style={styles.helpButton}
      activeOpacity={0.7}
    >
      <HelpCircle size={28} color={Colors.deepSage} strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

function ProfileHeaderRight() {
  return (
    <TouchableOpacity 
      onPress={() => router.push('/help')}
      style={styles.helpButton}
      activeOpacity={0.7}
    >
      <HelpCircle size={28} color={Colors.deepSage} strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

function YarnAIHeaderRight() {
  return (
    <TouchableOpacity 
      onPress={() => router.push('/help')}
      style={styles.helpButton}
      activeOpacity={0.7}
    >
      <HelpCircle size={28} color={Colors.deepSage} strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

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
          borderTopWidth: 1,
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
          headerTitle: t('tabs.inventory'),
          headerTitleAlign: 'left' as const,
          headerRight: InventoryHeaderRight,
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
        name="yarnai"
        options={{
          title: t('tabs.yarnai'),
          headerTitle: t('tabs.yarnai'),
          headerTitleAlign: 'left' as const,
          headerRight: YarnAIHeaderRight,
          tabBarIcon: ({ color, focused }) => (
            <Sparkles 
              color={focused ? Colors.deepTeal : Colors.warmGray} 
              size={26} 
              strokeWidth={focused ? 3 : 2}
            />
          ),
          tabBarAccessibilityLabel: t('tabs.yarnai'),
          tabBarItemStyle: {
            paddingVertical: 2,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          headerTitle: t('tabs.profile'),
          headerTitleAlign: 'left' as const,
          headerRight: ProfileHeaderRight,
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
