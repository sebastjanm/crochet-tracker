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
import { Volleyball } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/hooks/auth-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('auth.nameRequired'));
      return;
    }
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
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }
    if (!confirmPassword) {
      Alert.alert(t('common.error'), t('auth.confirmPasswordRequired'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email, password);
      Alert.alert(t('common.success'), t('auth.accountCreated'));
      router.replace('/projects');
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to create account');
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
              {t('auth.registerSubtitle')}
            </Text>
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

            <Input
              label={t('auth.confirmPassword')}
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

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
});