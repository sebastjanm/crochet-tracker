import { useState, useMemo, useCallback, Fragment } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  LogOut,
  ChevronRight,
  Package,
  Scissors,
  Settings,
  HelpCircle,
  Globe,
  FileText,
  DollarSign,
  Database,
  Trash2,
  Cloud,
  RefreshCw,
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { AvatarPickerModal } from '@/components/AvatarPickerModal';
import { useAuth } from '@/providers/AuthProvider';
import { useProjects } from '@/providers/ProjectsProvider';
import { useInventory } from '@/providers/InventoryProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { imageSyncQueue } from '@/lib/legend-state';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { mapProjectToRow } from '@/lib/legend-state/mappers';
import { useToast } from '@/components/Toast';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder } from '@/constants/pixelRatio';
import { ACCESSIBLE_COLORS } from '@/constants/accessibility';
import { loadAllMockData, clearAllData, getCurrentDataCounts } from '@/scripts/loadMockData';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;

/**
 * Profile Screen - User settings, stats, and account management.
 * Includes cloud sync controls for Pro users and developer tools.
 */
export default function ProfileScreen(): React.JSX.Element {
  const { user, logout, updateUser, refreshUser, isPro } = useAuth();
  const { projects, completedCount, inProgressCount, refreshProjects } = useProjects();
  const { items, refreshItems } = useInventory();
  const { language, changeLanguage, t } = useLanguage();
  const [isLoadingMockData, setIsLoadingMockData] = useState(false);
  const [isAvatarPickerVisible, setIsAvatarPickerVisible] = useState(false);
  const [isSyncingImages, setIsSyncingImages] = useState(false);
  const { showToast } = useToast();


  /**
   * Sync all local images to cloud storage.
   * Uses the useImageSync hook to scan and queue pending images.
   */
  const handleSyncImages = async () => {
    if (!user?.id || !isPro) return;

    setIsSyncingImages(true);
    try {
      // Use the image sync hook's scan function
      await imageSyncQueue.processQueue();

      const status = imageSyncQueue.getStatus();

      if (status.pending > 0) {
        showToast(
          `${t('profile.imagesSynced')}: ${status.pending} ${t('profile.queued')}`,
          'success',
          4000
        );
      } else if (status.completed > 0) {
        showToast(
          `${t('profile.allImagesUploaded')} (${status.completed})`,
          'info'
        );
      } else {
        showToast(t('profile.noImagesToSync'), 'info');
      }

      if (__DEV__) console.log('[Profile] Image sync status:', status);
    } catch (error) {
      if (__DEV__) console.error('[Profile] Image sync error:', error);
      showToast(
        error instanceof Error ? error.message : t('profile.syncFailed'),
        'error'
      );
    } finally {
      setIsSyncingImages(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('auth.logout'), 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        },
      ]
    );
  };

  /** Shows language selection dialog */
  const handleLanguageChange = useCallback(() => {
    Alert.alert(
      t('profile.language'),
      t('profile.selectLanguage'),
      [
        { text: 'English', onPress: () => changeLanguage('en') },
        { text: 'Slovenščina', onPress: () => changeLanguage('sl') },
        { text: 'Русский', onPress: () => changeLanguage('ru') },
        { text: 'Deutsch', onPress: () => changeLanguage('de') },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  }, [t, changeLanguage]);

  /** Shows currency selection dialog */
  const handleCurrencyChange = useCallback(() => {
    Alert.alert(
      t('profile.currency'),
      t('profile.selectCurrency'),
      [
        { text: 'EUR (€)', onPress: () => updateUser({ currency: 'EUR' }) },
        { text: 'USD ($)', onPress: () => updateUser({ currency: 'USD' }) },
        { text: 'GBP (£)', onPress: () => updateUser({ currency: 'GBP' }) },
        { text: 'RUB (₽)', onPress: () => updateUser({ currency: 'RUB' }) },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  }, [t, updateUser]);

  const handleAvatarSelect = async (avatarName: string) => {
    await updateUser({ avatar: avatarName });
  };

  // Development-only functions for loading mock data
  const handleLoadMockData = async () => {
    Alert.alert(
      'Load Mock Data',
      'This will load realistic sample data for development. Current data will be replaced. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load',
          onPress: async () => {
            try {
              setIsLoadingMockData(true);
              await loadAllMockData({ clearExisting: true });

              // Refresh all contexts to pick up new data
              await Promise.all([
                refreshUser(),
                refreshProjects(),
                refreshItems(),
              ]);

              Alert.alert(
                'Success!',
                'Mock data loaded and refreshed!\n\n• 1 User (Breda Crochet)\n• 6 Projects\n• 12 Inventory Items (7 yarns, 5 hooks)',
                [{ text: 'OK' }]
              );
            } catch (err) {
              if (__DEV__) console.error('Mock data loading error:', err);
              Alert.alert('Error', 'Failed to load mock data.');
            } finally {
              setIsLoadingMockData(false);
            }
          },
        },
      ]
    );
  };

  const handleClearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete ALL data including projects and inventory. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoadingMockData(true);
              await clearAllData();

              // Refresh all contexts to show empty state
              await Promise.all([
                refreshUser(),
                refreshProjects(),
                refreshItems(),
              ]);

              Alert.alert('Success', 'All data cleared.');
            } catch (err) {
              if (__DEV__) console.error('Clear data error:', err);
              Alert.alert('Error', 'Failed to clear data.');
            } finally {
              setIsLoadingMockData(false);
            }
          },
        },
      ]
    );
  };

  const handleViewDataCounts = async () => {
    try {
      const counts = await getCurrentDataCounts();
      Alert.alert(
        'Current Data',
        `User: ${counts.hasUser ? 'Loaded' : 'Not loaded'}\nProjects: ${counts.projectCount}\nInventory: ${counts.inventoryCount}`,
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Error', 'Failed to get data counts.');
    }
  };

  /**
   * Debug: Check image sync queue status
   */
  const handleCheckImageQueue = () => {
    const status = imageSyncQueue.getStatus();
    const failed = imageSyncQueue.getFailedItems();

    if (__DEV__) {
      console.log('[Profile] Image Queue Status:', status);
      console.log('[Profile] Failed Items:', failed);
    }

    // Count local vs cloud images in projects
    let projectLocalImages = 0;
    let projectCloudImages = 0;
    projects.forEach(p => {
      p.images?.forEach(img => {
        const uri = typeof img === 'string' ? img : img.uri;
        if (uri?.startsWith('file://')) projectLocalImages++;
        else if (uri?.startsWith('http')) projectCloudImages++;
      });
    });

    // Count local vs cloud images in inventory
    let inventoryLocalImages = 0;
    let inventoryCloudImages = 0;
    items.forEach(i => {
      i.images?.forEach(img => {
        const uri = typeof img === 'string' ? img : img.uri;
        if (uri?.startsWith('file://')) inventoryLocalImages++;
        else if (uri?.startsWith('http')) inventoryCloudImages++;
      });
    });

    const message = [
      `Queue Status:`,
      `• Total: ${status.total}`,
      `• Pending: ${status.pending}`,
      `• Uploading: ${status.uploading}`,
      `• Completed: ${status.completed}`,
      `• Failed: ${status.failed}`,
      ``,
      `Project Images:`,
      `• Local (file://): ${projectLocalImages}`,
      `• Cloud (https://): ${projectCloudImages}`,
      ``,
      `Inventory Images:`,
      `• Local (file://): ${inventoryLocalImages}`,
      `• Cloud (https://): ${inventoryCloudImages}`,
    ].join('\n');

    Alert.alert(
      '🔍 Image Queue Debug',
      message,
      [
        { text: 'Retry Failed', onPress: () => imageSyncQueue.retryFailed() },
        {
          text: 'Clear Failed',
          style: 'destructive',
          onPress: async () => {
            await imageSyncQueue.clearFailed();
            showToast('Cleared failed uploads', 'success');
          }
        },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  /**
   * Debug: Find and push orphaned local projects to Supabase
   * These are projects that exist in local storage but not in the cloud
   */
  const handlePushOrphanedProjects = async () => {
    if (!user?.id || !isPro || !isSupabaseConfigured()) {
      Alert.alert('Error', 'Must be logged in as Pro with Supabase configured');
      return;
    }

    try {
      // 1. Fetch projects from Supabase
      const { data: cloudProjects, error } = await supabase!
        .from('projects')
        .select('id, title')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (error) {
        Alert.alert('Error', `Failed to fetch cloud projects: ${error.message}`);
        return;
      }

      const cloudIds = new Set((cloudProjects as { id: string; title: string }[] || []).map(p => p.id));

      // 2. Find local-only projects
      const orphanedProjects = projects.filter(p => !cloudIds.has(p.id));

      if (orphanedProjects.length === 0) {
        Alert.alert(
          '✅ All Synced',
          `All ${projects.length} projects are in the cloud.\n\nLocal: ${projects.length}\nCloud: ${cloudProjects?.length || 0}`
        );
        return;
      }

      // 3. Show orphaned projects and offer to push
      const orphanedNames = orphanedProjects.map(p => `• ${p.title}`).join('\n');

      Alert.alert(
        `⚠️ ${orphanedProjects.length} Local-Only Projects`,
        `These projects are not in the cloud:\n\n${orphanedNames}\n\nPush them to Supabase?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Push to Cloud',
            onPress: async () => {
              let pushed = 0;
              const errors: string[] = [];

              for (const project of orphanedProjects) {
                try {
                  // Map to row format
                  const row = mapProjectToRow(project);

                  // Insert into Supabase (bypass strict typing for dynamic row)
                  const { error: insertError } = await (supabase as any)
                    .from('projects')
                    .upsert({
                      ...row,
                      user_id: user.id,
                    });

                  if (insertError) {
                    errors.push(`${project.title}: ${insertError.message}`);
                  } else {
                    pushed++;
                    if (__DEV__) console.log(`[Profile] Pushed project: ${project.title}`);
                  }
                } catch (err) {
                  errors.push(`${project.title}: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
              }

              if (errors.length > 0) {
                Alert.alert(
                  'Partial Success',
                  `Pushed ${pushed}/${orphanedProjects.length} projects.\n\nErrors:\n${errors.join('\n')}`
                );
              } else {
                Alert.alert('Success', `Pushed ${pushed} projects to Supabase!`);
                showToast(`${pushed} projects synced to cloud`, 'success');
              }
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  /** Memoized menu items configuration */
  const menuItems = useMemo(() => [
    {
      icon: <Globe size={20} color={Colors.charcoal} />,
      label: t('profile.language'),
      value: language === 'en' ? t('profile.english') :
             language === 'sl' ? t('profile.slovene') :
             language === 'ru' ? t('profile.russian') :
             t('profile.german'),
      onPress: handleLanguageChange,
    },
    {
      icon: <DollarSign size={20} color={Colors.charcoal} />,
      label: t('profile.currency'),
      value: user?.currency || 'EUR',
      onPress: handleCurrencyChange,
    },
    {
      icon: <Settings size={20} color={Colors.charcoal} />,
      label: t('profile.settings'),
      onPress: () => Alert.alert(t('profile.settings'), t('profile.settingsComingSoon')),
    },
    {
      icon: <HelpCircle size={20} color={Colors.charcoal} />,
      label: t('profile.helpCenter'),
      onPress: () => router.push('/help'),
    },
    {
      icon: <FileText size={20} color={Colors.charcoal} />,
      label: t('profile.legal'),
      onPress: () => router.push('/legal'),
    },
    {
      icon: <HelpCircle size={20} color={Colors.charcoal} />,
      label: t('profile.about'),
      onPress: () => router.push('/about' as Parameters<typeof router.push>[0]),
    },
  ], [t, language, user?.currency, handleLanguageChange, handleCurrencyChange]);

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.customHeader}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                {t('profile.title')}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                {t('profile.subtitle')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/help')}
              style={styles.helpButton}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Help and support"
              accessibilityHint="Get help and view tutorials"
            >
              <HelpCircle size={32} color={Colors.deepSage} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        <View style={styles.profileInfo}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setIsAvatarPickerVisible(true)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('profile.changeAvatar')}
            accessibilityHint={t('profile.tapToChangeAvatar')}
          >
            <Avatar user={user || undefined} size={96} />
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditText}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name || t('profile.defaultName')}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <AvatarPickerModal
          visible={isAvatarPickerVisible}
          onClose={() => setIsAvatarPickerVisible(false)}
          currentAvatar={user?.avatar}
          onSelectAvatar={handleAvatarSelect}
        />

        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Scissors size={24} color={Colors.sage} />
                <Text style={styles.statNumber}>{projects.length}</Text>
                <Text style={styles.statLabel}>{t('profile.projectsCount')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Package size={24} color={Colors.teal} />
                <Text style={styles.statNumber}>{items.length}</Text>
                <Text style={styles.statLabel}>{t('profile.inventoryCount')}</Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.sectionTitle}>{t('profile.yourProgress')}</Text>
          <Card>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>{t('profile.finishedProjects')}</Text>
              <Text style={styles.progressValue}>{completedCount}</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>{t('profile.inProgressProjects')}</Text>
              <Text style={styles.progressValue}>{inProgressCount}</Text>
            </View>
          </Card>
        </View>

        {/* Cloud Sync Section - Pro Users Only (Image Sync) */}
        {isPro && (
          <View style={styles.syncContainer}>
            <Text style={styles.sectionTitle}>{t('profile.cloudSync')}</Text>
            <Card>
              {/* Sync Images Button */}
              <TouchableOpacity
                style={styles.syncButton}
                onPress={handleSyncImages}
                disabled={isSyncingImages}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('profile.syncImages')}
                accessibilityHint={t('profile.syncImagesHint')}
              >
                {isSyncingImages ? (
                  <ActivityIndicator size="small" color={Colors.sage} />
                ) : (
                  <RefreshCw size={24} color={Colors.sage} />
                )}
                <View style={styles.syncButtonText}>
                  <Text style={styles.syncButtonLabel}>
                    {isSyncingImages ? t('profile.syncingImages') : t('profile.syncImages')}
                  </Text>
                  <Text style={styles.syncButtonDescription}>
                    {t('profile.syncImagesDescription')}
                  </Text>
                </View>
                <ChevronRight
                  size={20}
                  color={isSyncingImages ? Colors.warmGray : Colors.sage}
                  style={isSyncingImages ? { opacity: 0.5 } : undefined}
                />
              </TouchableOpacity>
            </Card>
          </View>
        )}

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          <Card>
            {menuItems.map((item, index) => (
              <Fragment key={index}>
                {index > 0 && <View style={styles.menuDivider} />}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityHint={`Open ${item.label}`}
                >
                  {item.icon}
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                  <ChevronRight size={20} color={Colors.warmGray} />
                </TouchableOpacity>
              </Fragment>
            ))}
          </Card>
        </View>

        {/* Development Mode Debug Section */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>🛠️ Developer Tools</Text>
            <Card>
              <TouchableOpacity
                style={styles.debugItem}
                onPress={handleLoadMockData}
                disabled={isLoadingMockData}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Load mock data"
              >
                {isLoadingMockData ? (
                  <ActivityIndicator size="small" color={Colors.sage} />
                ) : (
                  <Database size={20} color={Colors.sage} />
                )}
                <Text style={styles.debugLabel}>Load Mock Data</Text>
                <Text style={styles.debugDescription}>6 projects, 12 items</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.debugItem}
                onPress={handleViewDataCounts}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="View data counts"
              >
                <Package size={20} color={Colors.teal} />
                <Text style={styles.debugLabel}>View Data Counts</Text>
                <Text style={styles.debugDescription}>Check current storage</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.debugItem}
                onPress={handleCheckImageQueue}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Check image sync queue"
              >
                <Cloud size={20} color={Colors.sage} />
                <Text style={styles.debugLabel}>Image Queue Status</Text>
                <Text style={styles.debugDescription}>Debug image sync</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Push Orphaned Projects - Only for Pro users */}
              {isPro && (
                <>
                  <TouchableOpacity
                    style={styles.debugItem}
                    onPress={handlePushOrphanedProjects}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Push orphaned projects"
                  >
                    <RefreshCw size={20} color={Colors.teal} />
                    <Text style={styles.debugLabel}>Push Orphaned Projects</Text>
                    <Text style={styles.debugDescription}>Fix local-only data</Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />
                </>
              )}

              <TouchableOpacity
                style={styles.debugItem}
                onPress={handleClearAllData}
                disabled={isLoadingMockData}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear all data"
              >
                <Trash2 size={20} color={ACCESSIBLE_COLORS.errorAccessible} />
                <Text style={[styles.debugLabel, { color: ACCESSIBLE_COLORS.errorAccessible }]}>
                  Clear All Data
                </Text>
                <Text style={styles.debugDescription}>Delete everything</Text>
              </TouchableOpacity>
            </Card>
            <Text style={styles.debugNote}>
              These tools are only visible in development mode
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Button
            title={t('auth.logout')}
            variant="secondary"
            icon={<LogOut size={20} color={Colors.charcoal} />}
            onPress={handleLogout}
            size="large"
          />
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
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  customHeader: {
    backgroundColor: Colors.headerBg,
    paddingBottom: isSmallDevice ? 4 : 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallDevice ? 16 : isTablet ? 32 : 20,
    paddingVertical: isSmallDevice ? 12 : 16,
    maxWidth: isTablet ? 1200 : '100%',
    alignSelf: 'center',
    width: '100%',
    height: isSmallDevice ? 72 : isTablet ? 92 : 96,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  headerTitle: {
    ...Typography.title1,
    color: Colors.charcoal,
    fontWeight: '700' as const,
    fontSize: isSmallDevice ? 24 : isTablet ? 32 : 28,
    lineHeight: isSmallDevice ? 30 : isTablet ? 38 : 34,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 13 : 14,
    color: Colors.warmGray,
    opacity: 0.9,
    lineHeight: 18,
  },
  helpButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.beige,
  },
  avatarEditText: {
    fontSize: 14,
  },

  name: {
    ...Typography.title1,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  email: {
    ...Typography.body,
    color: Colors.warmGray,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statsCard: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.title1,
    color: Colors.charcoal,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.warmGray,
  },
  statDivider: {
    width: normalizeBorder(1),
    height: 60,
    backgroundColor: Colors.border,
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    marginBottom: 12,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  progressLabel: {
    ...Typography.body,
    color: Colors.charcoal,
  },
  progressValue: {
    ...Typography.title3,
    color: Colors.sage,
  },
  progressDivider: {
    height: normalizeBorder(1),
    backgroundColor: Colors.border,
  },
  syncContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 12,
  },
  syncButtonText: {
    flex: 1,
  },
  syncButtonLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '600' as const,
  },
  syncButtonDescription: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginTop: 2,
  },
  menuContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  menuLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    flex: 1,
  },
  menuValue: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginRight: 8,
  },
  menuDivider: {
    height: normalizeBorder(1),
    backgroundColor: Colors.border,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  // Debug section styles (development only)
  debugContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  debugTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    marginBottom: 12,
  },
  debugItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  debugLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    flex: 1,
    fontWeight: '600' as const,
  },
  debugDescription: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginRight: 8,
  },
  debugNote: {
    ...Typography.caption,
    color: Colors.warmGray,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});