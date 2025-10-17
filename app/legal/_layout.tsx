import React from 'react';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/hooks/language-context';

export default function LegalLayout() {
  const { t } = useLanguage();

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
      <Stack.Screen name="index" options={{ title: t('legal.title') }} />
      <Stack.Screen name="terms" options={{ title: t('legal.terms') }} />
      <Stack.Screen name="privacy" options={{ title: t('legal.privacy') }} />
      <Stack.Screen name="imprint" options={{ title: t('legal.imprint') }} />
    </Stack>
  );
}