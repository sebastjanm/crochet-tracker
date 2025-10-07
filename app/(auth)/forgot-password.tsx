import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { Volleyball, ArrowLeft } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/hooks/auth-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const { t } = useLanguage();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert(t('common.error'), t('auth.emailInvalid'));
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
      Alert.alert(t('common.success'), t('auth.resetPasswordSuccess'));
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

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
            <View style={styles.logoContainer}>
              <Volleyball size={48} color={Colors.terracotta} />
            </View>
            <Text style={styles.title}>artful.space</Text>
            <Text style={styles.subtitle}>
              {t('auth.forgotPasswordSubtitle')}
            </Text>
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
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '300' as const,
    letterSpacing: -0.5,
    color: Colors.charcoal,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
    color: Colors.warmGray,
    textAlign: 'center' as const,
    opacity: 0.8,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: 24,
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
    marginTop: 32,
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