import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function HelpLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: Colors.cream,
        },
        headerTintColor: Colors.charcoal,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="faq" options={{ title: "FAQ" }} />
      <Stack.Screen name="videos" options={{ title: "Video Guides" }} />
    </Stack>
  );
}