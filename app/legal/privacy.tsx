import React from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { DarkHeader } from '@/components/DarkHeader';
import { useLanguage } from '@/providers/LanguageProvider';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function PrivacyScreen() {
  const { t } = useLanguage();

  return (
    <View style={styles.backgroundContainer}>
      <DarkHeader
        title={t('legal.privacy')}
        variant="back"
        backLabel={t('common.back')}
        accessibilityLabel={t('common.back')}
      />

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