import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  SharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check, Volleyball, Box, Wrench } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/providers/LanguageProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Slide configuration - icons and translation keys
const SLIDE_CONFIG = [
  { Icon: Volleyball, key: 'slide1' },
  { Icon: Box, key: 'slide2' },
  { Icon: Wrench, key: 'slide3' },
] as const;

const TOTAL_SLIDES = SLIDE_CONFIG.length;

// Video intro asset
const introVideo = require('@/assets/CrochetTracker-intro034-ok.mp4');

const ONBOARDING_KEY = 'hasSeenOnboarding';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    if (__DEV__) console.error('[Onboarding] Failed to save:', error);
  }
}

// DEV only: Reset onboarding to show it again
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    if (__DEV__) console.log('[Onboarding] Reset - will show on next launch');
  } catch (error) {
    if (__DEV__) console.error('[Onboarding] Failed to reset:', error);
  }
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const scrollX = useSharedValue(0);
  const fadeOut = useSharedValue(1);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  // Video player - loop for background
  const player = useVideoPlayer(introVideo, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Ensure video plays after mount
  useEffect(() => {
    player.play();
  }, [player]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }): void => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  // Navigate after fade animation completes
  const navigateToLogin = async () => {
    await markOnboardingComplete();
    router.replace('/(auth)/welcome');
  };

  const handleSkip = () => {
    if (isExiting) return;
    setIsExiting(true);
    fadeOut.value = withTiming(0, { duration: 400 }, (finished) => {
      if (finished) {
        runOnJS(navigateToLogin)();
      }
    });
  };

  const handleGetStarted = () => {
    if (isExiting) return;
    setIsExiting(true);
    fadeOut.value = withTiming(0, { duration: 400 }, (finished) => {
      if (finished) {
        runOnJS(navigateToLogin)();
      }
    });
  };

  // Fade out animation style
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  const isLastSlide = currentIndex === TOTAL_SLIDES - 1;

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, containerAnimatedStyle]}>
        {/* Video Background */}
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />

        {/* Dark overlay for readability */}
        <View style={styles.overlay} />

        {/* Header: Skip button + Slide counter */}
        <View style={[styles.header, { top: insets.top + 16 }]}>
          <Text style={styles.slideCounter}>
            {t('onboarding.slideOf', { current: currentIndex + 1, total: TOTAL_SLIDES })}
          </Text>
          {!isLastSlide && (
            <Pressable onPress={handleSkip} hitSlop={20}>
              <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
            </Pressable>
          )}
        </View>

        {/* Slides */}
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {SLIDE_CONFIG.map((config, index) => (
            <SlideCard
              key={config.key}
              slideKey={config.key}
              Icon={config.Icon}
              index={index}
              scrollX={scrollX}
              isLast={index === TOTAL_SLIDES - 1}
              onGetStarted={handleGetStarted}
              t={t}
            />
          ))}
        </Animated.ScrollView>

        {/* Dot indicators */}
        <View style={[styles.dotsContainer, { bottom: insets.bottom + 40 }]}>
          {SLIDE_CONFIG.map((config, index) => (
            <DotIndicator key={config.key} index={index} scrollX={scrollX} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// Feature item with checkmark
function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.checkIcon}>
        <Check size={14} color={Colors.white} strokeWidth={3} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

// Individual slide card component
function SlideCard({
  slideKey,
  Icon,
  index,
  scrollX,
  isLast,
  onGetStarted,
  t,
}: {
  slideKey: 'slide1' | 'slide2' | 'slide3';
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  index: number;
  scrollX: SharedValue<number>;
  isLast: boolean;
  onGetStarted: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, 50],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const title = t(`onboarding.${slideKey}.title`);
  const subtitle = t(`onboarding.${slideKey}.subtitle`);
  const feature1 = t(`onboarding.${slideKey}.feature1`);
  const feature2 = t(`onboarding.${slideKey}.feature2`);
  const feature3 = t(`onboarding.${slideKey}.feature3`);

  return (
    <View style={styles.slideContainer}>
      <Animated.View style={[styles.cardContent, animatedStyle]}>
        <View style={styles.iconContainer}>
          <Icon size={40} color={Colors.white} strokeWidth={2} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <FeatureItem text={feature1} />
          <FeatureItem text={feature2} />
          <FeatureItem text={feature3} />
        </View>

        {isLast && (
          <Pressable style={styles.getStartedButton} onPress={onGetStarted}>
            <Text style={styles.getStartedText}>{t('onboarding.getStarted')}</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

// Dot indicator component
function DotIndicator({
  index,
  scrollX,
}: {
  index: number;
  scrollX: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );

    return {
      width,
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  header: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  slideCounter: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  skipText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 28,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresContainer: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  getStartedButton: {
    marginTop: 28,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
  },
  getStartedText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  dotsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
});
