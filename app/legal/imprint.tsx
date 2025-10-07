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

export default function ImprintScreen() {
  const { t } = useLanguage();

  return (
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