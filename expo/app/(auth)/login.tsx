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
 * LoginScreen - User authentication screen with email/password login.
 * Handles Supabase auth errors with localized messages.
 */
export default function LoginScreen(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();

  /** Handles login form submission with validation */
  const handleLogin = useCallback(async () => {
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

    setLoading(true);
    try {
      await login('User', email, password);
      router.replace('/projects');
    } catch (error: unknown) {
      // Parse Supabase auth errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      let userMessage = t('auth.invalidCredentials');

      if (errorMessage.includes('Invalid login credentials')) {
        userMessage = t('auth.invalidCredentials');
      } else if (errorMessage.includes('Email not confirmed')) {
        userMessage = t('auth.emailNotConfirmed');
      } else if (errorMessage.includes('Too many requests')) {
        userMessage = t('auth.tooManyRequests');
      } else if (errorMessage.includes('not configured')) {
        userMessage = t('auth.serviceUnavailable');
      }

      Alert.alert(t('common.error'), userMessage);
    } finally {
      setLoading(false);
    }
  }, [email, password, login, t]);

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

            <Button
              title={t('auth.loginButton')}
              onPress={handleLogin}
              loading={loading}
              size="large"
              style={styles.button}
            />

            <View style={styles.links}>
              <Link href="/(auth)/forgot-password" style={styles.link}>
                <Text style={styles.linkText}>{t('auth.forgotPassword')}</Text>
              </Link>
              
              <View style={styles.registerContainer}>
                <Text style={styles.registerHint}>{t('auth.loginHint')} </Text>
                <Link href="/(auth)/register" style={styles.link}>
                  <Text style={styles.linkTextBold}>{t('auth.registerLink')}</Text>
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
    gap: isSmallDevice ? 12 : 16,
  },
  link: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  linkText: {
    ...Typography.body,
    fontSize: isSmallDevice ? 14 : 16,
    color: Colors.terracotta,
    textAlign: 'center',
  },
  linkTextBold: {
    ...Typography.body,
    fontSize: isSmallDevice ? 14 : 16,
    color: Colors.terracotta,
    fontWeight: '600',
    textAlign: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  registerHint: {
    ...Typography.body,
    fontSize: isSmallDevice ? 14 : 16,
    color: Colors.warmGray,
    textAlign: 'center',
  },
});