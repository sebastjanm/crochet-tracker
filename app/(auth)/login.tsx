import React, { useState } from 'react';
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
import { useAuth } from '@/hooks/auth-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { buttonShadow } from '@/constants/pixelRatio';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return;
    }
    if (!validateEmail(email)) {
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
    } catch {
      Alert.alert(t('common.error'), t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>App terminated</Text>
          </View>
        </View>
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
              <YarnBallLogo size={48} color={Colors.terracotta} />
            </View>
            <Text style={styles.title}>artful.space</Text>
            <Text style={styles.subtitle}>
              {t('auth.loginSubtitle')}
            </Text>
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
  badgeContainer: {
    position: 'absolute' as const,
    top: isSmallDevice ? 40 : 60,
    right: isSmallDevice ? -30 : -40,
    zIndex: 999,
    transform: [{ rotate: '45deg' }],
  },
  badge: {
    backgroundColor: Colors.terracotta,
    paddingVertical: isSmallDevice ? 8 : 12,
    paddingHorizontal: isSmallDevice ? 40 : 60,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  badgeText: {
    color: Colors.cream,
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: '700' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
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
  logoContainer: {
    width: isSmallDevice ? 80 : 100,
    height: isSmallDevice ? 80 : 100,
    borderRadius: isSmallDevice ? 40 : 50,
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallDevice ? 16 : 24,
  },
  title: {
    fontSize: isSmallDevice ? 32 : isTablet ? 48 : 42,
    lineHeight: isSmallDevice ? 38 : isTablet ? 56 : 48,
    fontWeight: '300' as const,
    letterSpacing: -0.5,
    color: Colors.charcoal,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: isSmallDevice ? 14 : 16,
    lineHeight: isSmallDevice ? 20 : 22,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
    color: Colors.warmGray,
    textAlign: 'center' as const,
    opacity: 0.8,
    maxWidth: isTablet ? 480 : '100%',
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