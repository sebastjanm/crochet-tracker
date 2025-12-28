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
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function ImprintScreen() {
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
          <Text style={styles.title}>{t('legal.imprint')}</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>{t('legal.imprintCompanyTitle')}</Text>
        <Text style={styles.paragraph}>{t('legal.imprintCompanyName')}</Text>
        <Text style={styles.paragraph}>{t('legal.imprintCompanyAddress')}</Text>
        <Text style={styles.paragraph}>{t('legal.imprintCompanyCity')}</Text>
        <Text style={styles.paragraph}>{t('legal.imprintCompanyCountry')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.imprintContactTitle')}</Text>
        <Text style={styles.paragraph}>{t('legal.imprintContactEmail')}</Text>
        <Text style={styles.paragraph}>{t('legal.imprintContactPhone')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.imprintRegistrationTitle')}</Text>
        <Text style={styles.paragraph}>{t('legal.imprintRegistrationNumber')}</Text>
        <Text style={styles.paragraph}>{t('legal.imprintVatNumber')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.imprintRepresentativeTitle')}</Text>
        <Text style={styles.paragraph}>{t('legal.imprintRepresentativeName')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.imprintDisclaimerTitle')}</Text>
        <Text style={styles.paragraph}>{t('legal.imprintDisclaimerContent')}</Text>

        <Text style={styles.sectionTitle}>{t('legal.imprintCopyrightTitle')}</Text>
        <Text style={styles.paragraph}>{t('legal.imprintCopyrightContent')}</Text>
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
    marginBottom: 4,
  },
});