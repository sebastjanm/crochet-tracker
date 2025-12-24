import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Colors from '@/constants/colors';
import { Card } from '@/components/Card';
import { useLanguage } from '@/hooks/language-context';
import { normalizeBorder } from '@/constants/pixelRatio';

type FAQSection = 'projects' | 'inventory' | 'yarn' | 'hooks' | 'materials' | 'photos' | 'general';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  categoryId: FAQSection;
  category: string;
}



export default function FAQ() {
  const { t } = useLanguage();
  const { section } = useLocalSearchParams<{ section?: FAQSection }>();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryPositions = useRef<Record<string, number>>({});

  const faqData: FAQItem[] = useMemo(() => [
    // Projects
    {
      id: 'p1',
      categoryId: 'projects',
      category: t('help.faqCategoryProjects'),
      question: t('help.faqProjectsQ1'),
      answer: t('help.faqProjectsA1'),
    },
    {
      id: 'p2',
      categoryId: 'projects',
      category: t('help.faqCategoryProjects'),
      question: t('help.faqProjectsQ2'),
      answer: t('help.faqProjectsA2'),
    },
    // Inventory
    {
      id: 'i1',
      categoryId: 'inventory',
      category: t('help.faqCategoryInventory'),
      question: t('help.faqInventoryQ1'),
      answer: t('help.faqInventoryA1'),
    },
    {
      id: 'i2',
      categoryId: 'inventory',
      category: t('help.faqCategoryInventory'),
      question: t('help.faqInventoryQ2'),
      answer: t('help.faqInventoryA2'),
    },
    // Yarn
    {
      id: 'y1',
      categoryId: 'yarn',
      category: t('help.faqCategoryYarn'),
      question: t('help.faqYarnQ1'),
      answer: t('help.faqYarnA1'),
    },
    {
      id: 'y2',
      categoryId: 'yarn',
      category: t('help.faqCategoryYarn'),
      question: t('help.faqYarnQ2'),
      answer: t('help.faqYarnA2'),
    },
    // Hooks
    {
      id: 'h1',
      categoryId: 'hooks',
      category: t('help.faqCategoryHooks'),
      question: t('help.faqHooksQ1'),
      answer: t('help.faqHooksA1'),
    },
    {
      id: 'h2',
      categoryId: 'hooks',
      category: t('help.faqCategoryHooks'),
      question: t('help.faqHooksQ2'),
      answer: t('help.faqHooksA2'),
    },
    // Materials
    {
      id: 'm1',
      categoryId: 'materials',
      category: t('help.faqCategoryMaterials'),
      question: t('help.faqMaterialsQ1'),
      answer: t('help.faqMaterialsA1'),
    },
    // Photos
    {
      id: 'ph1',
      categoryId: 'photos',
      category: t('help.faqCategoryPhotos'),
      question: t('help.faqPhotosQ1'),
      answer: t('help.faqPhotosA1'),
    },
    // General
    {
      id: 'g1',
      categoryId: 'general',
      category: t('help.faqCategoryGeneral'),
      question: t('help.faqGeneralQ1'),
      answer: t('help.faqGeneralA1'),
    },
    {
      id: 'g2',
      categoryId: 'general',
      category: t('help.faqCategoryGeneral'),
      question: t('help.faqGeneralQ2'),
      answer: t('help.faqGeneralA2'),
    },
  ], [t]);

  // Auto-expand and scroll to section when deep-linked
  useEffect(() => {
    if (section) {
      // Expand all items in the target section
      const sectionItems = faqData.filter(item => item.categoryId === section);
      const itemIds = new Set(sectionItems.map(item => item.id));
      setExpandedItems(itemIds);

      // Scroll to section after a short delay to allow layout
      setTimeout(() => {
        const position = categoryPositions.current[section];
        if (position !== undefined && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: position - 20, animated: true });
        }
      }, 100);
    }
  }, [section, faqData]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Group by categoryId but use translated category for display
  const groupedFAQ = faqData.reduce((acc, item) => {
    if (!acc[item.categoryId]) {
      acc[item.categoryId] = { displayName: item.category, items: [] };
    }
    acc[item.categoryId].items.push(item);
    return acc;
  }, {} as Record<string, { displayName: string; items: FAQItem[] }>);

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerWrapper}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityLabel={t('common.back')}
              accessibilityRole="button"
            >
              <View style={styles.backCircle}>
                <ChevronLeft size={24} color={Colors.charcoal} strokeWidth={2.5} style={styles.backChevron} />
              </View>
              <Text style={styles.backText}>{t('common.back')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{t('help.faqTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('help.faqSubtitle')}
          </Text>
        </View>
      </SafeAreaView>

      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(groupedFAQ).map(([categoryId, { displayName, items }]) => (
          <View
            key={categoryId}
            style={styles.categorySection}
            onLayout={(event) => {
              categoryPositions.current[categoryId] = event.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.categoryTitle}>{displayName}</Text>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backChevron: {
    marginLeft: -6,
  },
  backText: {
    fontSize: 17,
    color: Colors.charcoal,
    fontWeight: '400',
    marginLeft: 8,
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
    gap: 16,
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