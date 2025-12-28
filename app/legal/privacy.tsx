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
import { useLanguage } from '@/providers/LanguageProvider';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function PrivacyScreen() {
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
          <Text style={styles.title}>{t('legal.privacy')}</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>{t('legal.privacyLastUpdated')}</Text>
        
        <Text style={styles.sectionTitle}>{t('legal.privacySection1Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.privacySection1Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.privacySection2Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.privacySection2Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.privacySection3Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.privacySection3Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.privacySection4Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.privacySection4Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.privacySection5Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.privacySection5Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.privacySection6Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.privacySection6Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.privacySection7Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.privacySection7Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.privacySection8Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.privacySection8Content')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.privacySection9Title')}</Text>
        <Text style={styles.paragraph}>{t('legal.privacySection9Content')}</Text>
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