import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { YarnBallLogo } from '@/components/YarnBallLogo';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;

/** Email validation regex pattern */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * RegisterScreen - New user registration with email confirmation.
 * Validates input and handles Supabase auth errors.
 */
export default function RegisterScreen(): React.JSX.Element {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();

  /** Handles registration form submission with validation */
  const handleRegister = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('auth.nameRequired'));
      return;
    }
    if (!email) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      Alert.alert(t('common.error'), t('auth.emailInvalid'));
      return;
    }
    if (!password) {
      Alert.alert(t('common.error'), t('auth.passwordRequired'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email, password);
      Alert.alert(
        t('auth.checkYourEmail'),
        t('auth.confirmationEmailSent'),
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: unknown) {
      // Parse Supabase auth errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      let userMessage = t('auth.registrationFailed');

      if (errorMessage.includes('already registered')) {
        userMessage = t('auth.emailAlreadyExists');
      } else if (errorMessage.includes('Password should be')) {
        userMessage = t('auth.passwordTooWeak');
      } else if (errorMessage.includes('Invalid email')) {
        userMessage = t('auth.emailInvalid');
      } else if (errorMessage.includes('not configured')) {
        userMessage = t('auth.serviceUnavailable');
      }

      Alert.alert(t('common.error'), userMessage);
    } finally {
      setLoading(false);
    }
  }, [name, email, password, register, t]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <YarnBallLogo size={isSmallDevice ? 80 : 100} color="#c59e4b" />
            <Text style={styles.title}>CROCHET TRACKER</Text>
            <Text style={styles.subtitle}>TRACK YOUR PROJECTS</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('auth.name')}
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Input
              label={t('auth.email')}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label={t('auth.password')}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.passwordHint}>{t('auth.passwordMinLength')}</Text>

            <Button
              title={t('auth.registerButton')}
              onPress={handleRegister}
              loading={loading}
              size="large"
              style={styles.button}
            />

            <View style={styles.links}>
              <View style={styles.loginContainer}>
                <Text style={styles.loginHint}>{t('auth.registerHint')} </Text>
                <Link href="/(auth)/login" style={styles.link}>
                  <Text style={styles.linkTextBold}>{t('auth.loginLink')}</Text>
                </Link>
              </View>
            </View>

            {/* Legal links - Required by App Store for registration screens */}
            <View style={styles.legalLinks}>
              <Text style={styles.legalText}>{t('auth.byRegistering')} </Text>
              <View style={styles.legalLinksRow}>
                <Link href="/legal/terms" style={styles.legalLink}>
                  <Text style={styles.legalLinkText}>{t('legal.terms')}</Text>
                </Link>
                <Text style={styles.legalText}> {t('common.and')} </Text>
                <Link href="/legal/privacy" style={styles.legalLink}>
                  <Text style={styles.legalLinkText}>{t('legal.privacy')}</Text>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: isSmallDevice ? 16 : isTablet ? 48 : 24,
    paddingVertical: isSmallDevice ? 16 : 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? 32 : 48,
    width: '100%',
  },
  title: {
    fontSize: isSmallDevice ? 24 : isTablet ? 32 : 28,
    fontWeight: '300' as const,
    fontFamily: Platform.select({ ios: 'Avenir-Light', android: 'sans-serif-light', default: undefined }),
    letterSpacing: 3,
    color: Colors.charcoal,
    marginTop: 20,
    marginBottom: 6,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: isSmallDevice ? 11 : 13,
    fontWeight: '300' as const,
    fontFamily: Platform.select({ ios: 'Avenir-Light', android: 'sans-serif-light', default: undefined }),
    letterSpacing: 4,
    color: Colors.warmGray,
    textAlign: 'center' as const,
  },
  form: {
    width: '100%',
    maxWidth: isTablet ? 480 : 480,
  },
  button: {
    marginTop: isSmallDevice ? 16 : 24,
  },
  links: {
    marginTop: isSmallDevice ? 24 : 32,
    alignItems: 'center',
  },
  link: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  linkTextBold: {
    ...Typography.body,
    fontSize: isSmallDevice ? 14 : 16,
    color: Colors.terracotta,
    fontWeight: '600',
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  loginHint: {
    ...Typography.body,
    fontSize: isSmallDevice ? 14 : 16,
    color: Colors.warmGray,
    textAlign: 'center',
  },
  passwordHint: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginTop: 4,
    marginBottom: 8,
  },
  legalLinks: {
    marginTop: isSmallDevice ? 20 : 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  legalText: {
    ...Typography.caption,
    fontSize: isSmallDevice ? 12 : 13,
    color: Colors.warmGray,
    textAlign: 'center',
  },
  legalLink: {
    paddingVertical: 2,
  },
  legalLinkText: {
    ...Typography.caption,
    fontSize: isSmallDevice ? 12 : 13,
    color: Colors.terracotta,
    textDecorationLine: 'underline',
  },
});