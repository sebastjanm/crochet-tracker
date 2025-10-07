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
import { Volleyball } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/hooks/auth-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

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
  links: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  link: {
    alignSelf: 'center',
  },
  linkText: {
    ...Typography.body,
    color: Colors.terracotta,
    textAlign: 'center',
  },
  linkTextBold: {
    ...Typography.body,
    color: Colors.terracotta,
    fontWeight: '600',
    textAlign: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerHint: {
    ...Typography.body,
    color: Colors.warmGray,
  },
});