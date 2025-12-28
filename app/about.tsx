/**
 * About Screen
 *
 * Displays app version, build info, and EAS Update status.
 * Uses expo-updates to show current update ID, channel, and status.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/updates/
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { X, RefreshCw, CheckCircle, Clock, Package } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { useLanguage } from '@/providers/LanguageProvider';

export default function AboutScreen() {
  const { t } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);

  // Get update info from expo-updates
  const {
    currentlyRunning,
    isUpdateAvailable,
    isUpdatePending,
  } = Updates.useUpdates();

  // App version from app.json
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber = Application.nativeBuildVersion ?? '-';

  // Update info
  const updateId = currentlyRunning?.updateId;
  const channel = currentlyRunning?.channel ?? (Updates.channel || 'embedded');
  const createdAt = currentlyRunning?.createdAt;
  const runtimeVersion = currentlyRunning?.runtimeVersion ?? appVersion;

  // Format date
  const formatDate = (date: Date | undefined): string => {
    if (!date) return t('about.embedded');
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Truncate update ID for display
  const truncateId = (id: string | undefined): string => {
    if (!id) return '-';
    return id.substring(0, 8) + '...';
  };

  // Get status info
  const getStatus = () => {
    if (isUpdatePending) {
      return {
        text: t('about.updatePending'),
        color: Colors.terracotta,
        icon: Clock,
      };
    }
    if (isUpdateAvailable) {
      return {
        text: t('about.updateAvailable'),
        color: Colors.deepTeal,
        icon: Package,
      };
    }
    return {
      text: t('about.upToDate'),
      color: Colors.deepSage,
      icon: CheckCircle,
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Check for updates manually
  const handleCheckUpdates = async () => {
    if (__DEV__) {
      Alert.alert(
        t('about.title'),
        'Update checking is disabled in development mode.'
      );
      return;
    }

    setIsChecking(true);
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert(
          t('about.updateAvailable'),
          t('updates.message'),
          [
            { text: t('updates.later'), style: 'cancel' },
            {
              text: t('updates.restart'),
              onPress: async () => {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              },
            },
          ]
        );
      } else {
        Alert.alert(t('about.title'), t('about.noUpdateAvailable'));
      }
    } catch (error) {
      console.error('[About] Error checking for updates:', error);
      Alert.alert(t('common.error'), 'Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

  // Handle restart for pending update
  const handleRestart = async () => {
    if (isUpdatePending) {
      await Updates.reloadAsync();
    }
  };

  // Combined version string: "1.0.0 (42)"
  const versionDisplay = `${appVersion} (${buildNumber})`;

  const infoRows = [
    { label: t('about.version'), value: versionDisplay },
    { label: t('about.runtimeVersion'), value: truncateId(runtimeVersion) },
    { label: t('about.channel'), value: channel },
    { label: t('about.updateId'), value: truncateId(updateId) },
    { label: t('about.lastUpdated'), value: formatDate(createdAt) },
  ];

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerWrapper}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
              accessibilityLabel={t('common.close')}
              accessibilityRole="button"
            >
              <X size={24} color={Colors.charcoal} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{t('about.title')}</Text>
          <Text style={styles.subtitle}>{t('about.appName')}</Text>
        </View>
      </SafeAreaView>

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Card */}
          <Card style={styles.statusCard}>
            <View style={styles.statusContent}>
              <View style={[styles.statusIcon, { backgroundColor: status.color + '15' }]}>
                <StatusIcon size={28} color={status.color} strokeWidth={2} />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusLabel}>{t('about.status')}</Text>
                <Text style={[styles.statusText, { color: status.color }]}>
                  {status.text}
                </Text>
              </View>
            </View>
            {isUpdatePending && (
              <TouchableOpacity
                style={[styles.restartButton, { backgroundColor: status.color }]}
                onPress={handleRestart}
              >
                <Text style={styles.restartButtonText}>{t('updates.restart')}</Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* Version Info Card */}
          <Card style={styles.infoCard}>
            {infoRows.map((row, index) => (
              <View
                key={row.label}
                style={[
                  styles.infoRow,
                  index < infoRows.length - 1 && styles.infoRowBorder,
                ]}
              >
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </Card>

          {/* Check for Updates Button */}
          <TouchableOpacity
            style={styles.checkButton}
            onPress={handleCheckUpdates}
            disabled={isChecking}
            activeOpacity={0.7}
          >
            {isChecking ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <RefreshCw size={20} color={Colors.white} strokeWidth={2} />
                <Text style={styles.checkButtonText}>
                  {t('about.checkForUpdates')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Development Mode Notice */}
          {__DEV__ && (
            <View style={styles.devNotice}>
              <Text style={styles.devNoticeText}>
                Development Mode - Update info may be limited
              </Text>
            </View>
          )}
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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: Colors.warmGray,
  },
  statusCard: {
    padding: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.warmGray,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  restartButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  restartButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoCard: {
    padding: 0,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 15,
    color: Colors.warmGray,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.charcoal,
  },
  checkButton: {
    backgroundColor: Colors.deepTeal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  checkButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  devNotice: {
    backgroundColor: Colors.cream,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  devNoticeText: {
    fontSize: 13,
    color: Colors.warmGray,
    fontStyle: 'italic',
  },
});
