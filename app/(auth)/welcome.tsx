import { View, Text, StyleSheet, Dimensions, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { YarnBallLogo } from '@/components/YarnBallLogo';
import { useLanguage } from '@/providers/LanguageProvider';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;

/**
 * WelcomeScreen - Entry point after onboarding.
 * Gives users the choice to sign in or create an account.
 */
export default function WelcomeScreen(): React.JSX.Element {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo and branding */}
        <View style={styles.header}>
          <YarnBallLogo size={isSmallDevice ? 80 : 100} color="#c59e4b" />
          <Text style={styles.title}>CROCHET TRACKER</Text>
          <Text style={styles.subtitle}>TRACK YOUR PROJECTS</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/(auth)/register')}
            accessibilityRole="button"
            accessibilityLabel={t('welcome.createAccount')}
          >
            <Text style={styles.primaryButtonText}>{t('welcome.createAccount')}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
            accessibilityLabel={t('welcome.signIn')}
          >
            <Text style={styles.secondaryButtonText}>{t('welcome.signIn')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sage,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: isSmallDevice ? 24 : isTablet ? 64 : 32,
    paddingTop: isSmallDevice ? 60 : 100,
    paddingBottom: isSmallDevice ? 40 : 60,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: isSmallDevice ? 24 : isTablet ? 32 : 28,
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Avenir-Light', android: 'sans-serif-light', default: undefined }),
    letterSpacing: 3,
    color: Colors.white,
    marginTop: 20,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isSmallDevice ? 11 : 13,
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Avenir-Light', android: 'sans-serif-light', default: undefined }),
    letterSpacing: 4,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  buttons: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: Colors.white,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.deepSage,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
