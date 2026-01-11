import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { BookOpen, Play } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { DarkHeader } from '@/components/DarkHeader';
import { useLanguage } from '@/providers/LanguageProvider';

export default function HelpCenter() {
  const { t } = useLanguage();
  
  const helpOptions = [
    {
      id: 'faq',
      title: t('help.textTutorials'),
      subtitle: t('help.textTutorialsDescription'),
      icon: BookOpen,
      route: '/help/faq' as const,
      color: Colors.deepTeal,
    },
    {
      id: 'videos',
      title: t('help.videoGuides'),
      subtitle: t('help.videoGuidesDescription'),
      icon: Play,
      route: '/help/videos' as const,
      color: Colors.terracotta,
    },
  ];

  return (
    <View style={styles.backgroundContainer}>
      <DarkHeader
        title={t('help.title')}
        subtitle={t('help.subtitle')}
        variant="close"
        accessibilityLabel={t('common.close')}
      />

      <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.optionsContainer}>
            {helpOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => {
                    if (option.id === 'faq') {
                      router.push('/help/faq');
                    } else if (option.id === 'videos') {
                      router.push('/help/videos');
                    }
                  }}
                  activeOpacity={0.7}
                  style={styles.optionButton}
                >
                  <Card style={styles.optionCard}>
                    <View style={styles.optionContent}>
                      <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
                        <IconComponent 
                          size={32} 
                          color={option.color} 
                          strokeWidth={2}
                        />
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={styles.optionTitle}>{option.title}</Text>
                        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
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
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    width: '100%',
  },
  optionCard: {
    padding: 20,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: Colors.warmGray,
    lineHeight: 20,
  },
});