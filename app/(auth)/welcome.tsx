import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
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
          <View style={styles.logoContainer}>
            <YarnBallLogo size={64} color={Colors.white} />
          </View>
          <Text style={styles.title}>Crochet Tracker</Text>
          <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
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
  logoContainer: {
    width: isSmallDevice ? 100 : 120,
    height: isSmallDevice ? 100 : 120,
    borderRadius: isSmallDevice ? 50 : 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: isSmallDevice ? 36 : isTablet ? 52 : 44,
    fontWeight: '300',
    letterSpacing: -0.5,
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isSmallDevice ? 16 : 18,
    lineHeight: isSmallDevice ? 24 : 28,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    maxWidth: isTablet ? 400 : 300,
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
