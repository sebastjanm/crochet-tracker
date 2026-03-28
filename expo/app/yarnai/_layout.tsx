import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function YarnAILayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.cream },
      }}
    >
      <Stack.Screen name="chat" />
      <Stack.Screen name="ideas" />
      <Stack.Screen name="image-generator" />
      <Stack.Screen name="voice" />
    </Stack>
  );
}
