import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function LegalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.headerBg,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="imprint" />
    </Stack>
  );
}