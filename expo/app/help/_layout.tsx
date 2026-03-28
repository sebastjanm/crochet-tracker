import { Stack } from "expo-router";
import { Colors } from "@/constants/colors";

export default function HelpLayout() {
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
      <Stack.Screen name="faq" />
      <Stack.Screen name="videos" />
    </Stack>
  );
}