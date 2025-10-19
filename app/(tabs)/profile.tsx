import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
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
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/hooks/auth-context';
import { useProjects } from '@/hooks/projects-context';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { projects, completedCount, inProgressCount } = useProjects();
  const { items } = useInventory();
  const { language, changeLanguage, t } = useLanguage();

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
              <HelpCircle size={isSmallDevice ? 24 : 28} color={Colors.deepSage} strokeWidth={2.5} />
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
    backgroundColor: Colors.cream,
  },
  safeArea: {
    backgroundColor: Colors.cream,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  customHeader: {
    backgroundColor: Colors.cream,
    paddingBottom: isSmallDevice ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
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
    padding: isSmallDevice ? 6 : 8,
    backgroundColor: Colors.white,
    borderRadius: 24,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.deepSage,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
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
    width: 1,
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
    height: 1,
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
    height: 1,
    backgroundColor: Colors.border,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});