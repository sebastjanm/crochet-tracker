import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
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
  CloudOff,
  RefreshCw,
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/hooks/auth-context';
import { useProjects } from '@/hooks/projects-context';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, cardShadow } from '@/constants/pixelRatio';
import { ACCESSIBLE_COLORS } from '@/constants/accessibility';
import { loadAllMockData, clearAllData, getCurrentDataCounts } from '@/scripts/loadMockData';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;

export default function ProfileScreen() {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const { projects, completedCount, inProgressCount, refreshProjects } = useProjects();
  const { items, refreshItems } = useInventory();
  const { language, changeLanguage, t } = useLanguage();
  const {
    sync,
    isSyncing,
    lastSyncedAt,
    error: syncError,
    isEnabled: isSyncEnabled,
    isOnline,
    clearError,
  } = useSupabaseSync();
  const [isLoadingMockData, setIsLoadingMockData] = useState(false);

  const handleSync = async () => {
    const result = await sync();
    if (result?.success) {
      Alert.alert(
        'Sync Complete',
        `Pushed ${result.pushed} items, pulled ${result.pulled} items`,
        [{ text: 'OK' }]
      );
    } else if (syncError) {
      Alert.alert('Sync Failed', syncError.message, [
        { text: 'OK', onPress: clearError },
      ]);
    }
  };

  const userName = user?.name?.split(' ')[0] || t('profile.defaultName');

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

  const handleLanguageChange = () => {
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
  };

  const handleCurrencyChange = () => {
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
            } catch (error) {
              Alert.alert('Error', 'Failed to load mock data. Check console for details.');
              console.error('Mock data loading error:', error);
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
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
              console.error('Clear data error:', error);
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
    } catch (error) {
      Alert.alert('Error', 'Failed to get data counts.');
    }
  };

  const menuItems = [
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
      onPress: () => Alert.alert(t('profile.about'), `${t('profile.version')}: 1.0.0`),
    },
  ];

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
          <View style={styles.avatarContainer}>
            <Avatar user={user || undefined} size={96} />
          </View>
          <Text style={styles.name}>{user?.name || t('profile.defaultName')}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

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

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          <Card>
            {menuItems.map((item, index) => (
              <React.Fragment key={index}>
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
              </React.Fragment>
            ))}
          </Card>
        </View>

        {/* Development Mode Debug Section */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>🛠️ Developer Tools</Text>
            <Card>
              {/* Cloud Sync Button */}
              <TouchableOpacity
                style={styles.debugItem}
                onPress={handleSync}
                disabled={isSyncing || !isSyncEnabled || !isOnline}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Sync with Supabase cloud"
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color={Colors.deepTeal} />
                ) : isSyncEnabled && isOnline ? (
                  <Cloud size={20} color={Colors.deepTeal} />
                ) : (
                  <CloudOff size={20} color={Colors.warmGray} />
                )}
                <View style={styles.syncLabelContainer}>
                  <Text style={[styles.debugLabel, (!isSyncEnabled || !isOnline) && styles.disabledLabel]}>
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Text>
                  {lastSyncedAt && (
                    <Text style={styles.syncTimestamp}>
                      Last: {lastSyncedAt.toLocaleTimeString()}
                    </Text>
                  )}
                  {!isSyncEnabled && (
                    <Text style={styles.syncWarning}>
                      Pro + Supabase required
                    </Text>
                  )}
                  {isSyncEnabled && !isOnline && (
                    <Text style={styles.syncWarning}>
                      Offline
                    </Text>
                  )}
                </View>
                <Text style={styles.debugDescription}>
                  {!isSyncEnabled ? 'Not configured' : !isOnline ? 'No connection' : 'Push to cloud'}
                </Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

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
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    marginBottom: 16,
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
  syncLabelContainer: {
    flex: 1,
  },
  syncTimestamp: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 11,
    marginTop: 2,
  },
  syncWarning: {
    ...Typography.caption,
    color: Colors.terracotta,
    fontSize: 11,
    marginTop: 2,
  },
  disabledLabel: {
    color: Colors.warmGray,
  },
});