/**
 * My Journey Screen
 *
 * A personal storytelling screen that helps solo crochet makers
 * reflect on their craft journey. Uses warm narrative language
 * that adapts to any data size.
 *
 * Design principles:
 * 1. Story over Statistics - Tell their journey, don't chart it
 * 2. Every Number Feels Good - "4 skeins waiting" not "only 4 skeins"
 * 3. No Empty States - Adaptive language for any data size
 * 4. Warm & Personal - Like a letter to yourself, not a dashboard
 *
 * @see /docs/plans/2025-01-21-my-journey-design.md
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Volleyball, Wrench, Sparkles, Flame, Plus, Clock } from 'lucide-react-native';
import { DarkHeader } from '@/components/DarkHeader';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';
import {
  useJourneyStats,
  getTimeComparison,
  getDistanceComparison,
  formatJourneyDate,
} from '@/hooks/useJourneyStats';

/**
 * Get the correct translation key suffix for Slavic languages (Slovenian, Russian)
 * which have different forms for 1, 2, 3-4, and 5+
 */
function getPluralForm(count: number): 'One' | 'Two' | 'Few' | '' {
  if (count === 1) return 'One';
  if (count === 2) return 'Two';
  if (count >= 3 && count <= 4) return 'Few';
  return ''; // 5+ uses the default (genitive plural)
}

export default function JourneyScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const stats = useJourneyStats();

  // Helper to get pluralized translation for Slavic languages (Slovenian, Russian)
  // Uses different keys for 1, 2, 3-4, and 5+ to handle grammatical number
  const tPlural = (baseKey: string, count: number, paramName = 'count') => {
    const suffix = getPluralForm(count);
    const key = suffix ? `${baseKey}${suffix}` : baseKey;
    return t(key, { [paramName]: count });
  };

  // Loading state
  if (stats.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <DarkHeader
          title={t('journey.title')}
          variant="back"
          backLabel={t('common.back')}
        />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={Colors.sage} />
        </View>
      </View>
    );
  }

  // Empty state - no data at all
  if (!stats.hasAnyData) {
    return (
      <View style={styles.container}>
        <DarkHeader
          title={t('journey.title')}
          variant="back"
          backLabel={t('common.back')}
        />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyContent}>
            <Text style={styles.emptyEmoji}>🧶</Text>
            <Text style={styles.emptyTitle}>{t('journey.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('journey.emptySubtitle')}</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/add-project')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('journey.addFirstProject')}
            >
              <Plus size={20} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.emptyButtonText}>{t('journey.addFirstProject')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Build the time comparison text
  const timeComparison = stats.totalHours > 0 ? getTimeComparison(stats.totalHours) : null;
  const distanceComparison =
    stats.totalYarnMeters > 0 ? getDistanceComparison(stats.totalYarnMeters) : null;

  // Check if first project is still in progress (no completed projects)
  const hasCompletedProjects = stats.completedCount > 0;

  return (
    <View style={styles.container}>
      <DarkHeader
        title={t('journey.title')}
        variant="back"
        backLabel={t('common.back')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Opening Story */}
        {stats.journeyStartDate && (
          <View
            style={styles.section}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${t('journey.storyBeganWith', {
              date: formatJourneyDate(stats.journeyStartDate),
            })} ${stats.firstCompletedProjectName ? t('journey.withFirstProject', { projectName: stats.firstCompletedProjectName }) : ''}`}
          >
            <Text style={styles.storyText}>
              {t('journey.storyBeganWith', {
                date: formatJourneyDate(stats.journeyStartDate),
              })}
            </Text>
            {stats.firstCompletedProjectName && (
              <Text style={styles.storyHighlight}>
                {t('journey.withFirstProject', {
                  projectName: stats.firstCompletedProjectName,
                })}
                {!hasCompletedProjects && (
                  <Text style={styles.storyMuted}>
                    {' '}
                    {t('journey.stillInProgress')}
                  </Text>
                )}
              </Text>
            )}
          </View>
        )}

        {/* Section 2: Time Investment */}
        {stats.totalHours > 0 && (
          <View style={styles.card}>
            <View style={styles.collectionRow}>
              <Clock size={20} color={Colors.teal} />
              <Text style={styles.collectionText}>
                {stats.totalHours >= 500
                  ? tPlural('journey.trueArtisan', stats.totalHours, 'hours')
                  : tPlural('journey.hoursWithYarn', stats.totalHours, 'hours')}
              </Text>
            </View>
            {timeComparison && (
              <Text style={styles.cardSubtitle}>
                {t('journey.thatsAbout', {
                  comparison: t(`journey.funComparison.${timeComparison.type}`, {
                    count: timeComparison.count,
                  }),
                })}
              </Text>
            )}
          </View>
        )}

        {/* Section 3: Your Collection */}
        {(stats.yarnCount > 0 || stats.hookCount > 0) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('journey.yourCollection')}</Text>

            {/* Yarn line */}
            <View style={styles.collectionRow}>
              <Volleyball size={20} color={Colors.sage} />
              <Text style={styles.collectionText}>
                {stats.yarnCount === 0
                  ? t('journey.yarnFirstWaiting')
                  : stats.yarnCount === 1
                    ? t('journey.yarnOneReady')
                    : stats.yarnCount > 10
                      ? t('journey.yarnProud', { count: stats.yarnCount })
                      : t('journey.yarnWaiting', { count: stats.yarnCount })}
              </Text>
            </View>

            {/* Hook line */}
            <View style={styles.collectionRow}>
              <Wrench size={20} color={Colors.sage} />
              <Text style={styles.collectionText}>
                {stats.hookCount === 0
                  ? t('journey.hookFirst')
                  : stats.hookCount === 1
                    ? t('journey.hookOne')
                    : t('journey.hooksCollection', { count: stats.hookCount })}
              </Text>
            </View>
          </View>
        )}

        {/* Section 4: Your Creations */}
        {(stats.completedCount > 0 || stats.inProgressCount > 0) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('journey.yourCreations')}</Text>

            {/* Completed line */}
            <View style={styles.collectionRow}>
              <Sparkles size={20} color={Colors.teal} />
              <Text style={styles.collectionText}>
                {stats.completedCount === 0
                  ? t('journey.firstAwaits')
                  : stats.completedCount > 10
                    ? t('journey.manyFinished', { count: stats.completedCount })
                    : stats.completedCount === 1
                      ? t('journey.oneFinished')
                      : stats.completedCount === 2
                        ? t('journey.twoFinished')
                        : stats.completedCount <= 4
                          ? t('journey.fewFinished', { count: stats.completedCount })
                          : t('journey.finishedWithLove', { count: stats.completedCount })}
              </Text>
            </View>

            {/* In Progress line */}
            {stats.inProgressCount > 0 && (
              <View style={styles.collectionRow}>
                <Flame size={20} color={Colors.warning} />
                <Text style={styles.collectionText}>
                  {stats.inProgressCount === 1
                    ? t('journey.oneInProgress')
                    : stats.inProgressCount === 2
                      ? t('journey.twoInProgress')
                      : t('journey.inProgressNow', { count: stats.inProgressCount })}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Section 5: Fun Fact */}
        {distanceComparison && (
          <View style={styles.funFactCard}>
            <Text style={styles.funFactLabel}>{t('journey.funFact')}</Text>
            <Text style={styles.funFactText}>{t('journey.yarnCouldStretch')}</Text>
            <Text style={styles.funFactHighlight}>
              {stats.totalYarnMeters >= 1000
                ? tPlural('journey.kilometers', Math.round(stats.totalYarnMeters / 1000))
                : tPlural('journey.meters', Math.round(stats.totalYarnMeters))}
            </Text>
            <Text style={styles.funFactComparison}>
              {t(`journey.comparison.${distanceComparison.type}`, {
                count: distanceComparison.count,
              })}{' '}
              {distanceComparison.type === 'eiffelTower' ? '🗼' : ''}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('journey.footerMessage')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.headerBg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.headerBg,
  },
  loadingContent: {
    flex: 1,
    backgroundColor: Colors.beige,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Opening Story
  section: {
    marginBottom: 24,
  },
  storyText: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontSize: 22,
    lineHeight: 30,
  },
  storyHighlight: {
    ...Typography.body,
    color: Colors.deepSage,
    fontSize: 18,
    lineHeight: 26,
    marginTop: 4,
  },
  storyMuted: {
    color: Colors.warmGray,
    fontStyle: 'italic',
  },

  // Cards
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  cardTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontSize: 20,
    lineHeight: 28,
  },
  cardSubtitle: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 4,
  },

  // Section titles
  sectionTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  // Collection rows
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  collectionText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },

  // Fun Fact
  funFactCard: {
    backgroundColor: Colors.linen,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  funFactLabel: {
    ...Typography.caption,
    color: Colors.deepSage,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  funFactText: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 15,
    textAlign: 'center',
  },
  funFactHighlight: {
    ...Typography.title1,
    color: Colors.charcoal,
    fontSize: 28,
    fontWeight: '700',
    marginVertical: 8,
    textAlign: 'center',
  },
  funFactComparison: {
    ...Typography.body,
    color: Colors.deepSage,
    fontSize: 16,
    textAlign: 'center',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 14,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.beige,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.sage,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
