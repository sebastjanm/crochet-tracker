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
import { Link } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
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
 * ForgotPasswordScreen - Password reset request form.
 * Sends reset email via Supabase auth.
 */
export default function ForgotPasswordScreen(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const { t } = useLanguage();

  /** Handles password reset request with validation */
  const handleResetPassword = useCallback(async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      Alert.alert(t('common.error'), t('auth.emailInvalid'));
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
      Alert.alert(t('common.success'), t('auth.resetPasswordSuccess'));
    } catch {
      Alert.alert(t('common.error'), t('auth.resetPasswordFailed'));
    } finally {
      setLoading(false);
    }
  }, [email, resetPassword, t]);

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
            {!emailSent ? (
              <>
                <Input
                  label={t('auth.email')}
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Button
                  title={t('auth.resetPasswordButton')}
                  onPress={handleResetPassword}
                  loading={loading}
                  size="large"
                  style={styles.button}
                />
              </>
            ) : (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>
                  A password reset email has been sent to {email}
                </Text>
                <Text style={styles.successSubtext}>
                  Please check your email and follow the instructions to reset your password.
                </Text>
              </View>
            )}

            <View style={styles.links}>
              <Link href="/(auth)/login" style={styles.backLink}>
                <View style={styles.backContainer}>
                  <ArrowLeft size={16} color={Colors.terracotta} />
                  <Text style={styles.backText}>{t('auth.backToLogin')}</Text>
                </View>
              </Link>
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
  successContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.beige,
    borderRadius: 12,
    marginBottom: 24,
  },
  successText: {
    ...Typography.body,
    color: Colors.charcoal,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  successSubtext: {
    ...Typography.caption,
    color: Colors.warmGray,
    textAlign: 'center',
  },
  links: {
    marginTop: isSmallDevice ? 24 : 32,
    alignItems: 'center',
  },
  backLink: {
    alignSelf: 'center',
  },
  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    ...Typography.body,
    color: Colors.terracotta,
    fontWeight: '600',
  },
});