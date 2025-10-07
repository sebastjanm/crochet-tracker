import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, FileText, Shield, Building } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.description}>{t('legal.description')}</Text>
        
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  content: {
    padding: 16,
  },
  description: {
    ...Typography.body,
    color: Colors.warmGray,
    marginBottom: 24,
    lineHeight: 22,
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
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.warmGray,
    textAlign: 'center',
  },
});