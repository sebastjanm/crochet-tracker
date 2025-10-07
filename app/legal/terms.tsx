import React from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function TermsScreen() {
  const { t } = useLanguage();

  return (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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