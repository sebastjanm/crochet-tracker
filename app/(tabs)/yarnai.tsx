import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { 
  MessageSquare, 
  ImageIcon, 
  Lightbulb, 
  Search, 
  Mic,
  ChevronRight 
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/hooks/language-context';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.warmGray,
    textAlign: 'center',
    maxWidth: 280,
  },
  appsGrid: {
    gap: 16,
  },
  appCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  appTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
    flex: 1,
  },
  chevron: {
    opacity: 0.6,
  },
  appDescription: {
    ...Typography.body,
    color: Colors.warmGray,
    lineHeight: 22,
    marginBottom: 8,
  },
  appFeatures: {
    ...Typography.caption,
    color: Colors.deepTeal,
    fontWeight: '600' as const,
  },
  comingSoonCard: {
    backgroundColor: Colors.beige,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    opacity: 0.7,
  },
  comingSoonBadge: {
    backgroundColor: Colors.warmGray,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  comingSoonText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600' as const,
  },
});

export default function YarnAI() {
  const { t } = useLanguage();

  const aiApps = [
    {
      id: 'chat',
      title: t('yarnai.chatTitle'),
      description: t('yarnai.chatDescription'),
      features: t('yarnai.chatFeatures'),
      icon: MessageSquare,
      iconColor: Colors.deepTeal,
      backgroundColor: '#E6F7F5',
      route: '/yarnai/chat',
    },
    {
      id: 'image-generator',
      title: t('yarnai.imageGeneratorTitle'),
      description: t('yarnai.imageGeneratorDescription'),
      features: t('yarnai.imageGeneratorFeatures'),
      icon: ImageIcon,
      iconColor: '#8B5CF6',
      backgroundColor: '#F3F0FF',
      route: '/yarnai/image-generator',
    },
    {
      id: 'idea-generator',
      title: t('yarnai.projectIdeasTitle'),
      description: t('yarnai.projectIdeasDescription'),
      features: t('yarnai.projectIdeasFeatures'),
      icon: Lightbulb,
      iconColor: '#F59E0B',
      backgroundColor: '#FEF3C7',
      route: '/yarnai/ideas',
    },
    {
      id: 'voice-assistant',
      title: t('yarnai.voiceAssistantTitle'),
      description: t('yarnai.voiceAssistantDescription'),
      features: t('yarnai.voiceAssistantFeatures'),
      icon: Mic,
      iconColor: '#EF4444',
      backgroundColor: '#FEE2E2',
      route: '/yarnai/voice',
    },
  ];

  const comingSoonApps = [
    {
      id: 'pattern-search',
      title: t('yarnai.patternSearchTitle'),
      description: t('yarnai.patternSearchDescription'),
      features: t('yarnai.patternSearchFeatures'),
      icon: Search,
      iconColor: Colors.warmGray,
      backgroundColor: Colors.beige,
    },
  ];

  const handleAppPress = (route: string) => {
    router.push(route as any);
  };

  const handleComingSoon = (appName: string) => {
    // Could show a modal or toast instead of alert
    console.log(`${appName} coming soon!`);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('yarnai.title')}</Text>
          <Text style={styles.subtitle}>{t('yarnai.subtitle')}</Text>
        </View>

        <View style={styles.appsGrid}>
          {aiApps.map((app) => {
            const IconComponent = app.icon;
            return (
              <TouchableOpacity
                key={app.id}
                style={styles.appCard}
                onPress={() => handleAppPress(app.route)}
                activeOpacity={0.7}
              >
                <View style={styles.appHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: app.backgroundColor }]}>
                    <IconComponent size={24} color={app.iconColor} />
                  </View>
                  <Text style={styles.appTitle}>{app.title}</Text>
                  <ChevronRight size={20} color={Colors.warmGray} style={styles.chevron} />
                </View>
                <Text style={styles.appDescription}>{app.description}</Text>
                <Text style={styles.appFeatures}>{app.features}</Text>
              </TouchableOpacity>
            );
          })}

          {comingSoonApps.map((app) => {
            const IconComponent = app.icon;
            return (
              <TouchableOpacity
                key={app.id}
                style={styles.comingSoonCard}
                onPress={() => handleComingSoon(app.title)}
                activeOpacity={0.7}
              >
                <View style={styles.appHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: app.backgroundColor }]}>
                    <IconComponent size={24} color={app.iconColor} />
                  </View>
                  <Text style={[styles.appTitle, { color: Colors.warmGray }]}>{app.title}</Text>
                  <ChevronRight size={20} color={Colors.warmGray} style={styles.chevron} />
                </View>
                <Text style={[styles.appDescription, { color: Colors.warmGray }]}>{app.description}</Text>
                <Text style={[styles.appFeatures, { color: Colors.warmGray }]}>{app.features}</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>{t('yarnai.comingSoon')}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}