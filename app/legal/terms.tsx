import React from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function TermsScreen() {
  const { t } = useLanguage();

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerWrapper}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
              accessibilityLabel={t('common.back')}
              accessibilityRole="button"
            >
              <ChevronLeft size={24} color={Colors.deepSage} strokeWidth={2.5} />
              <Text style={styles.backLabel}>{t('common.back')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{t('legal.terms')}</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>{t('legal.termsLastUpdated')}</Text>
        
        <Text style={styles.sectionTitle}>{t('legal.termsSection1Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.termsSection1Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.termsSection2Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.termsSection2Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.termsSection3Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.termsSection3Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.termsSection4Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.termsSection4Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.termsSection5Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.termsSection5Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.termsSection6Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.termsSection6Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.termsSection7Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.termsSection7Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.termsSection8Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.termsSection8Content')}</Text>
        </View>
      </ScrollView>
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
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.linen,
  },
  backLabel: {
    fontSize: 16,
    color: Colors.deepSage,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.charcoal,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  lastUpdated: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    ...Typography.body,
    color: Colors.charcoal,
    lineHeight: 22,
    marginBottom: 8,
  },
});