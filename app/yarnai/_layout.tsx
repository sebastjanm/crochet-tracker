import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/hooks/language-context';

export default function YarnAILayout() {
  const { t } = useLanguage();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.cream,
        },
        headerTintColor: Colors.charcoal,
        headerTitleStyle: {
          ...Typography.title3,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="chat" options={{ title: t('yarnai.chatTitle') }} />
      <Stack.Screen name="ideas" options={{ title: t('yarnai.projectIdeasTitle') }} />
      <Stack.Screen name="image-generator" options={{ title: t('yarnai.imageGeneratorTitle') }} />
      <Stack.Screen name="voice" options={{ title: t('yarnai.voiceAssistantTitle') }} />
    </Stack>
  );
}
