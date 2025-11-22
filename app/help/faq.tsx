import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { Card } from '@/components/Card';
import { useLanguage } from '@/hooks/language-context';
import { normalizeBorder } from '@/constants/pixelRatio';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}



export default function FAQ() {
  const { t } = useLanguage();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const faqData: FAQItem[] = useMemo(() => [
    {
      id: '1',
      category: t('help.projects'),
      question: t('help.faq1Question'),
      answer: t('help.faq1Answer'),
    },
    {
      id: '2',
      category: t('help.projects'),
      question: t('help.faq2Question'),
      answer: t('help.faq2Answer'),
    },
    {
      id: '3',
      category: t('help.inventory'),
      question: t('help.faq3Question'),
      answer: t('help.faq3Answer'),
    },
    {
      id: '4',
      category: t('help.inventory'),
      question: t('help.faq4Question'),
      answer: t('help.faq4Answer'),
    },
    {
      id: '5',
      category: t('help.general'),
      question: t('help.faq5Question'),
      answer: t('help.faq5Answer'),
    },
    {
      id: '6',
      category: t('help.general'),
      question: t('help.faq6Question'),
      answer: t('help.faq6Answer'),
    },
  ], [t]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const groupedFAQ = faqData.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('help.faqTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('help.faqSubtitle')}
          </Text>
        </View>

        {Object.entries(groupedFAQ).map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.faqGrid}>
              {items.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleExpanded(item.id)}
                    activeOpacity={0.7}
                    style={styles.faqItem}
                  >
                    <Card style={[styles.faqCard, isExpanded && styles.expandedCard]}>
                      <View style={styles.questionRow}>
                        <Text style={styles.question}>{item.question}</Text>
                        {isExpanded ? (
                          <ChevronDown size={20} color={Colors.deepTeal} strokeWidth={2} />
                        ) : (
                          <ChevronRight size={20} color={Colors.warmGray} strokeWidth={2} />
                        )}
                      </View>
                      {isExpanded && (
                        <View style={styles.answerContainer}>
                          <Text style={styles.answer}>{item.answer}</Text>
                        </View>
                      )}
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.warmGray,
    lineHeight: 24,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.deepTeal,
    marginBottom: 16,
  },
  faqGrid: {
    gap: 12,
  },
  faqItem: {
    width: '100%',
  },
  faqCard: {
    padding: 16,
  },
  expandedCard: {
    backgroundColor: Colors.beige,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.charcoal,
    marginRight: 12,
    lineHeight: 22,
  },
  answerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: normalizeBorder(1),
    borderTopColor: Colors.border,
  },
  answer: {
    fontSize: 14,
    color: Colors.warmGray,
    lineHeight: 20,
  },
});