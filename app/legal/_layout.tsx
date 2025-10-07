import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/hooks/language-context';

export default function LegalLayout() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerTintColor: Colors.charcoal,
        headerTitleStyle: {
          ...Typography.title3,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('legal.title'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color={Colors.charcoal} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          title: t('legal.terms'),
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          title: t('legal.privacy'),
        }}
      />
      <Stack.Screen
        name="imprint"
        options={{
          title: t('legal.imprint'),
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginRight: 16,
  },
});