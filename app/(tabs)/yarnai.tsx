import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  MessageSquare,
  ImageIcon,
  Lightbulb,
  Search,
  Mic,
  ChevronRight,
  HelpCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/hooks/language-context';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  safeArea: {
    backgroundColor: Colors.cream,
  },
  customHeader: {
    backgroundColor: Colors.cream,
    paddingBottom: isSmallDevice ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallDevice ? 16 : isTablet ? 32 : 20,
    paddingVertical: isSmallDevice ? 12 : 16,
    maxWidth: isTablet ? 1200 : '100%',
    alignSelf: 'center',
    width: '100%',
    minHeight: 56,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  headerTitle: {
    ...Typography.title1,
    color: Colors.charcoal,
    fontWeight: '700' as const,
    fontSize: isSmallDevice ? 24 : isTablet ? 32 : 28,
    lineHeight: isSmallDevice ? 30 : isTablet ? 38 : 34,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '500' as const,
    lineHeight: isSmallDevice ? 17 : 18,
    opacity: 0.9,
  },
  helpButton: {
    padding: isSmallDevice ? 6 : 8,
    backgroundColor: Colors.white,
    borderRadius: 24,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.deepSage,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  scrollContent: {
    padding: 16,
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
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.customHeader}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                {t('yarnai.title')}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                {t('yarnai.headerSubtitle')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/help')}
              style={styles.helpButton}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Help and support"
              accessibilityHint="Get help and view tutorials"
            >
              <HelpCircle size={isSmallDevice ? 24 : 28} color={Colors.deepSage} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.appsGrid}>
          {aiApps.map((app) => {
            const IconComponent = app.icon;
            return (
              <TouchableOpacity
                key={app.id}
                style={styles.appCard}
                onPress={() => handleAppPress(app.route)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={app.title}
                accessibilityHint={app.description}
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
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${app.title} - ${t('yarnai.comingSoon')}`}
                accessibilityHint={app.description}
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
    </View>
  );
}