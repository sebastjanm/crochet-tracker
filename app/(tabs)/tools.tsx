import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MessageSquare,
  Lightbulb,
  Ruler,
  ImageIcon,
  Mic,
  Sparkles,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/hooks/language-context';
import { normalizeBorder, cardShadow, normalizeBorderOpacity, getPixelRatio } from '@/constants/pixelRatio';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;

// DEBUG: Log pixel ratio on load to verify detection
console.log('🔍 DEBUG: Device pixel ratio =', getPixelRatio());

// Calculate card dimensions for perfect 2×3 grid
const getCardDimensions = () => {
  const screenWidth = width;
  // Optimize padding for better alignment on all devices
  const containerPadding = isSmallDevice ? 16 : isTablet ? 32 : 20;
  const gridGap = isSmallDevice ? 12 : isTablet ? 20 : 16;
  const totalPadding = containerPadding * 2;
  const availableWidth = screenWidth - totalPadding;
  const cardWidth = (availableWidth - gridGap) / 2;
  const cardHeight = cardWidth * 0.92; // Optimized height for better screen fit

  return { cardWidth, cardHeight, gridGap, containerPadding };
};

const { cardWidth, cardHeight, gridGap, containerPadding } = getCardDimensions();

export default function ToolsScreen() {
  const { t } = useLanguage();

  const tools = [
    {
      id: 'unit-conversion',
      title: t('tools.unitConversion'),
      subtitle: t('tools.unitConversionSubtitle'),
      icon: Ruler,
      iconColor: Colors.deepTeal,
      gradientColors: ['#F0F9FF', '#E0F2FE'] as const,
      route: null, // TODO: Create unit conversion screen
    },
    {
      id: 'yarnai-chat',
      title: t('tools.yarnaiChat'),
      subtitle: t('tools.yarnaiChatSubtitle'),
      icon: MessageSquare,
      iconColor: Colors.sage,
      gradientColors: ['#F0FDF4', '#DCFCE7'] as const,
      route: '/yarnai/chat',
    },
    {
      id: 'project-ideas',
      title: t('tools.projectIdeas'),
      subtitle: t('tools.projectIdeasSubtitle'),
      icon: Lightbulb,
      iconColor: '#F59E0B',
      gradientColors: ['#FFFBEB', '#FEF3C7'] as const,
      route: '/yarnai/ideas',
    },
    {
      id: 'image-generator',
      title: t('tools.imageGenerator'),
      subtitle: t('tools.imageGeneratorSubtitle'),
      icon: ImageIcon,
      iconColor: '#8B5CF6',
      gradientColors: ['#F3F0FF', '#E9D5FF'] as const,
      route: '/yarnai/image-generator',
    },
    {
      id: 'voice-assistant',
      title: t('tools.voiceAssistant'),
      subtitle: t('tools.voiceAssistantSubtitle'),
      icon: Mic,
      iconColor: '#EF4444',
      gradientColors: ['#FEE2E2', '#FECACA'] as const,
      route: '/yarnai/voice',
    },
    {
      id: 'coming-soon',
      title: t('tools.moreComing'),
      subtitle: t('tools.moreComingSubtitle'),
      icon: Sparkles,
      iconColor: Colors.warmGray,
      gradientColors: ['#FAFAF9', '#F5F5F4'] as const,
      route: null,
      isPlaceholder: true,
    },
  ];

  const handleToolPress = (tool: typeof tools[0]) => {
    if (tool.isPlaceholder) {
      // Could show a toast or modal about upcoming features
      console.log('More tools coming soon!');
      return;
    }

    if (tool.route) {
      router.push(tool.route as any);
    } else {
      // Tool not implemented yet
      console.log(`${tool.title} coming soon!`);
    }
  };

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('tools.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('tools.subtitle')}</Text>
        </View>

        {/* 2×3 Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {tools.map((tool) => {
              const IconComponent = tool.icon;

              return (
                <TouchableOpacity
                  key={tool.id}
                  style={[
                    styles.toolCard,
                    { width: cardWidth, height: cardHeight },
                  ]}
                  onPress={() => handleToolPress(tool)}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={tool.title}
                  accessibilityHint={tool.subtitle}
                  accessibilityState={{ disabled: tool.isPlaceholder }}
                >
                  <LinearGradient
                    colors={tool.gradientColors}
                    style={styles.cardGradient}
                  >
                    {/* Icon Container */}
                    <View style={[
                      styles.iconContainer,
                      tool.isPlaceholder && styles.iconContainerDisabled
                    ]}>
                      <IconComponent
                        size={isSmallDevice ? 24 : 28}
                        color={tool.iconColor}
                        strokeWidth={1.5}
                      />
                    </View>

                    {/* Text Content */}
                    <View style={styles.cardContent}>
                      <Text
                        style={[
                          styles.cardTitle,
                          tool.isPlaceholder && styles.cardTitleDisabled
                        ]}
                        numberOfLines={2}
                      >
                        {tool.title}
                      </Text>
                      <Text
                        style={[
                          styles.cardSubtitle,
                          tool.isPlaceholder && styles.cardSubtitleDisabled
                        ]}
                        numberOfLines={2}
                      >
                        {tool.subtitle}
                      </Text>
                    </View>

                    {/* Placeholder Badge */}
                    {tool.isPlaceholder && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>
                          {t('tools.soon')}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: isSmallDevice ? 20 : isTablet ? 40 : 24,
    paddingTop: isSmallDevice ? 12 : isTablet ? 24 : 16,
    paddingBottom: isSmallDevice ? 16 : isTablet ? 32 : 20,
    alignItems: 'center',
    minHeight: isSmallDevice ? 72 : isTablet ? 92 : 96,
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.largeTitle,
    color: Colors.charcoal,
    fontWeight: '300' as const,
    fontSize: isSmallDevice ? 28 : isTablet ? 40 : 32,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: isSmallDevice ? 14 : isTablet ? 17 : 15,
    fontWeight: '400' as const,
    textAlign: 'center',
    opacity: 0.85,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: containerPadding,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: gridGap,
    maxWidth: isTablet ? 800 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  toolCard: {
    borderRadius: isSmallDevice ? 16 : 20,
    // Removed overflow: 'hidden' - it clips iOS shadows making them look like borders!
    borderWidth: normalizeBorder(0.5),
    borderColor: `rgba(0, 0, 0, ${normalizeBorderOpacity(0.04)})`,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  cardGradient: {
    flex: 1,
    padding: isSmallDevice ? 14 : isTablet ? 20 : 16,
    justifyContent: 'space-between',
    borderRadius: isSmallDevice ? 16 : 20,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: isSmallDevice ? 10 : 12,
  },
  iconContainer: {
    width: isSmallDevice ? 48 : isTablet ? 60 : 52,
    height: isSmallDevice ? 48 : isTablet ? 60 : 52,
    borderRadius: isSmallDevice ? 12 : 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderWidth: normalizeBorder(0.5),
    borderColor: `rgba(0, 0, 0, ${normalizeBorderOpacity(0.05)})`,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: normalizeBorderOpacity(0.04),
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  iconContainerDisabled: {
    opacity: 0.5,
  },
  cardTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontSize: isSmallDevice ? 15 : isTablet ? 19 : 16,
    fontWeight: '500' as const,
    lineHeight: isSmallDevice ? 19 : isTablet ? 24 : 21,
    letterSpacing: -0.2,
    marginBottom: 4,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
      default: {},
    }),
  },
  cardTitleDisabled: {
    color: Colors.warmGray,
    opacity: 0.6,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12,
    fontWeight: '400' as const,
    lineHeight: isSmallDevice ? 15 : isTablet ? 19 : 16,
    opacity: 0.75,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
      default: {},
    }),
  },
  cardSubtitleDisabled: {
    opacity: 0.5,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: isSmallDevice ? 12 : 16,
    right: isSmallDevice ? 12 : 16,
    backgroundColor: `rgba(107, 107, 107, ${normalizeBorderOpacity(0.12)})`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: normalizeBorder(0.5),
    borderColor: `rgba(107, 107, 107, ${normalizeBorderOpacity(0.15)})`,
  },
  comingSoonText: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
