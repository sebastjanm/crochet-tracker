import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight, FileText, Shield, Building, X } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { useLanguage } from '@/providers/LanguageProvider';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder } from '@/constants/pixelRatio';

export default function LegalScreen() {
  const { t } = useLanguage();

  const legalItems = [
    {
      id: 'terms',
      icon: <FileText size={24} color={Colors.charcoal} />,
      title: t('legal.terms'),
      description: t('legal.termsDescription'),
      route: '/legal/terms' as const,
    },
    {
      id: 'privacy',
      icon: <Shield size={24} color={Colors.charcoal} />,
      title: t('legal.privacy'),
      description: t('legal.privacyDescription'),
      route: '/legal/privacy' as const,
    },
    {
      id: 'imprint',
      icon: <Building size={24} color={Colors.charcoal} />,
      title: t('legal.imprint'),
      description: t('legal.imprintDescription'),
      route: '/legal/imprint' as const,
    },
  ];

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerWrapper}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
              accessibilityLabel={t('common.close')}
              accessibilityRole="button"
            >
              <X size={24} color={Colors.charcoal} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{t('legal.title')}</Text>
          <Text style={styles.subtitle}>{t('legal.description')}</Text>
        </View>
      </SafeAreaView>

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.itemsContainer}>
            {legalItems.map((item) => (
              <Card key={item.id} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardContent}
                  onPress={() => router.push(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>{item.icon}</View>
                  <View style={styles.textContainer}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  </View>
                  <ChevronRight size={20} color={Colors.warmGray} />
                </TouchableOpacity>
              </Card>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('legal.lastUpdated')}</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: Colors.headerBg,
  },
  safeArea: {
    backgroundColor: Colors.headerBg,
  },
  headerWrapper: {
    backgroundColor: Colors.headerBg,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.charcoal,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.warmGray,
    lineHeight: 24,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  itemsContainer: {
    gap: 12,
  },
  card: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  itemDescription: {
    ...Typography.caption,
    color: Colors.warmGray,
    lineHeight: 18,
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: normalizeBorder(1),
    borderTopColor: Colors.border,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.warmGray,
    textAlign: 'center',
  },
});