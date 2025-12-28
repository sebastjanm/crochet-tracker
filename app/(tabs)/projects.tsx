import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Clock, CheckCircle, Lightbulb, Volleyball, HelpCircle, PauseCircle, RotateCcw, Zap } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { SearchableFilterBar } from '@/components/SearchableFilterBar';
import { Avatar } from '@/components/Avatar';
import { useToast } from '@/components/Toast';
import { useProjects } from '@/hooks/projects-context';
import { useLanguage } from '@/hooks/language-context';
import { useAuth } from '@/hooks/auth-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Project, ProjectStatus, getImageSource } from '@/types';
import { normalizeBorder, normalizeBorderOpacity, cardShadow, buttonShadow } from '@/constants/pixelRatio';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;

/**
 * Projects Screen - Main projects list with filtering, search, and "currently working on" feature.
 * Displays projects in a grid layout with status indicators and quick actions.
 */
export default function ProjectsScreen(): React.JSX.Element {
  const {
    projects,
    toDoCount,
    inProgressCount,
    onHoldCount,
    completedCount,
    froggedCount,
    currentlyWorkingOnProjects,
    toggleCurrentlyWorkingOn,
  } = useProjects();
  const { t } = useLanguage();
  const { user, isPro } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const userName = user?.name?.split(' ')[0] || t('profile.defaultName');

  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  /** Memoized filtered projects based on status filter and search query */
  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return projects
      .filter(project => filter === 'all' || project.status === filter)
      .filter(project => {
        if (!query) return true;
        return (
          project.title?.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.notes?.toLowerCase().includes(query)
        );
      });
  }, [projects, filter, searchQuery]);

  /** Pull-to-refresh handler - triggers visual feedback */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Legend-State handles sync automatically; this provides visual feedback
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  /** Handles long press to toggle "currently working on" status */
  const handleLongPress = useCallback(async (project: Project) => {
    const success = await toggleCurrentlyWorkingOn(project.id);
    if (!success) {
      showToast(t('projects.maxActiveProjects'), 'warning');
    } else {
      const isNowActive = !project.isCurrentlyWorkingOn;
      showToast(
        isNowActive ? t('projects.addedToWorkingOn') : t('projects.removedFromWorkingOn'),
        'success'
      );
    }
  }, [toggleCurrentlyWorkingOn, showToast, t]);

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'to-do':
        return <Lightbulb size={14} color={Colors.white} />;
      case 'in-progress':
        return <Clock size={14} color={Colors.white} />;
      case 'on-hold':
        return <PauseCircle size={14} color={Colors.white} />;
      case 'completed':
        return <CheckCircle size={14} color={Colors.white} />;
      case 'frogged':
        return <RotateCcw size={14} color={Colors.white} />;
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'to-do':
        return Colors.filterToDo;
      case 'in-progress':
        return Colors.filterInProgress;
      case 'on-hold':
        return Colors.filterOnHold;
      case 'completed':
        return Colors.filterCompleted;
      case 'frogged':
        return Colors.filterFrogged;
    }
  };

  /** Renders a single project card in the grid */
  const renderProject = useCallback(({ item }: { item: Project }) => {
    const defaultImageIndex = item.defaultImageIndex ?? 0;
    const displayImage = item.images[defaultImageIndex] || item.images[0];
    const isActive = item.isCurrentlyWorkingOn === true;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/project/${item.id}`)}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={400}
        activeOpacity={0.8}
        style={styles.gridItem}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} project${isActive ? ', currently working on' : ''}`}
        accessibilityHint={`Tap to view details. Long press to ${isActive ? 'remove from' : 'mark as'} currently working on`}
      >
        <View style={[styles.projectCard, isActive && styles.projectCardActive]}>
          {displayImage ? (
            <Image
              source={getImageSource(displayImage)}
              style={styles.projectImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.projectImage, styles.placeholderImage]}>
              <Volleyball size={48} color={Colors.warmGray} />
            </View>
          )}
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]}>
            {getStatusIcon(item.status)}
          </View>
          {isActive && (
            <View style={styles.activeIndicator}>
              <Zap size={14} color={Colors.white} fill={Colors.white} />
            </View>
          )}
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [handleLongPress]);

  /** Gets the translated label for a project type */
  const getProjectTypeLabel = useCallback((type?: string) => {
    if (!type) return t('projects.projectTypes.other');
    return t(`projects.projectTypes.${type}`) || t('projects.projectTypes.other');
  }, [t]);

  /** Formats a date for display in project cards */
  const formatStartDate = useCallback((date?: Date | string) => {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  /** Renders a project card in the "currently working on" horizontal list */
  const renderActiveProject = useCallback(({ item }: { item: Project }) => {
    const defaultImageIndex = item.defaultImageIndex ?? 0;
    const displayImage = item.images[defaultImageIndex] || item.images[0];
    const startDateFormatted = formatStartDate(item.startDate);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/project/${item.id}`)}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={400}
        activeOpacity={0.8}
        style={styles.activeProjectItem}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, currently working on`}
        accessibilityHint="Tap to view details. Long press to remove from currently working on"
      >
        <View style={styles.activeProjectCard}>
          {displayImage ? (
            <Image
              source={getImageSource(displayImage)}
              style={styles.activeProjectImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.activeProjectImage, styles.placeholderImage]}>
              <Volleyball size={36} color={Colors.warmGray} />
            </View>
          )}
          <View style={styles.activeProjectInfo}>
            <Text style={styles.activeProjectTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.activeProjectType} numberOfLines={1}>
              {getProjectTypeLabel(item.projectType)}
            </Text>
            {startDateFormatted && (
              <Text style={styles.activeProjectDate} numberOfLines={1}>
                {startDateFormatted}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [handleLongPress, getProjectTypeLabel, formatStartDate]);

  /** Memoized status filters with icons and counts */
  const statusFilters = useMemo(() => [
    { key: 'all', label: t('projects.all'), count: projects.length, icon: <Volleyball size={18} color={filter === 'all' ? Colors.white : Colors.deepSage} />, color: Colors.deepSage },
    { key: 'to-do', label: t('projects.toDo'), count: toDoCount, icon: <Lightbulb size={18} color={filter === 'to-do' ? Colors.white : Colors.filterToDo} />, color: Colors.filterToDo },
    { key: 'in-progress', label: t('projects.inProgress'), count: inProgressCount, icon: <Clock size={18} color={filter === 'in-progress' ? Colors.white : Colors.filterInProgress} />, color: Colors.filterInProgress },
    { key: 'on-hold', label: t('projects.onHold'), count: onHoldCount, icon: <PauseCircle size={18} color={filter === 'on-hold' ? Colors.white : Colors.filterOnHold} />, color: Colors.filterOnHold },
    { key: 'completed', label: t('projects.completed'), count: completedCount, icon: <CheckCircle size={18} color={filter === 'completed' ? Colors.white : Colors.filterCompleted} />, color: Colors.filterCompleted },
    { key: 'frogged', label: t('projects.frogged'), count: froggedCount, icon: <RotateCcw size={18} color={filter === 'frogged' ? Colors.white : Colors.filterFrogged} />, color: Colors.filterFrogged },
  ], [t, filter, projects.length, toDoCount, inProgressCount, onHoldCount, completedCount, froggedCount]);

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.customHeader}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Avatar user={user || undefined} size={isSmallDevice ? 44 : isTablet ? 52 : 56} />
              {isPro && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.headerGreeting} numberOfLines={1} ellipsizeMode="tail">
                {t('home.greeting')}
              </Text>
              <Text style={styles.headerUserName} numberOfLines={1} ellipsizeMode="tail">
                {userName}
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

      <SearchableFilterBar
        filters={statusFilters.map(f => ({ id: f.key, label: f.label, count: f.count, icon: f.icon, color: f.color }))}
        selectedFilter={filter}
        onFilterChange={(id) => setFilter(id as ProjectStatus | 'all')}
        searchPlaceholder={t('common.searchProjects')}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <View style={styles.container}>
      {/* Currently Working On Section - Now below filters */}
      {currentlyWorkingOnProjects.length > 0 && (
        <View style={styles.activeSection}>
          <View style={styles.activeSectionHeader}>
            <Zap size={18} color={Colors.deepTeal} />
            <Text style={styles.activeSectionTitle}>{t('projects.currentlyWorkingOn')}</Text>
          </View>
          <FlatList
            data={currentlyWorkingOnProjects}
            renderItem={renderActiveProject}
            keyExtractor={(item) => `active-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeProjectsList}
          />
        </View>
      )}

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={<Volleyball size={64} color={Colors.warmGray} />}
          title={filter === 'all' && !searchQuery ? t('projects.noProjects') : t('projects.noProjectsInCategory')}
          description={filter === 'all' && !searchQuery ? t('projects.startFirstProject') : t('projects.tryDifferentFilter')}
          action={
            <Button
              title={filter === 'all' && !searchQuery ? t('projects.addFirstProject') : t('projects.addProject')}
              icon={<Plus size={20} color={Colors.white} />}
              onPress={() => router.push('/add-project')}
              size="large"
            />
          }
        />
      ) : (
        <FlatList
          data={filteredProjects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.sage}
            />
          }
        />
      )}

      {projects.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: 24 + insets.bottom }]}
          onPress={() => router.push('/add-project')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('projects.addProject')}
          accessibilityHint={t('projects.createNewProject')}
        >
          <Plus size={32} color={Colors.white} strokeWidth={3} />
        </TouchableOpacity>
      )}
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
  customHeader: {
    backgroundColor: Colors.headerBg,
    paddingBottom: isSmallDevice ? 4 : 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? 16 : isTablet ? 32 : 20,
    paddingVertical: isSmallDevice ? 12 : 16,
    gap: isSmallDevice ? 12 : 16,
    maxWidth: isTablet ? 1200 : '100%',
    alignSelf: 'center',
    width: '100%',
    height: isSmallDevice ? 72 : isTablet ? 92 : 96,
  },
  avatarContainer: {
    position: 'relative',
  },
  proBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: Colors.deepTeal,
    paddingHorizontal: isSmallDevice ? 5 : 6,
    paddingVertical: isSmallDevice ? 1 : 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.headerBg,
  },
  proBadgeText: {
    color: Colors.white,
    fontSize: isSmallDevice ? 8 : isTablet ? 10 : 9,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
    minWidth: 0,
  },
  headerGreeting: {
    ...Typography.body,
    color: Colors.warmGray,
    fontWeight: '400' as const,
    fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14,
    lineHeight: isSmallDevice ? 17 : isTablet ? 21 : 18,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  headerUserName: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontWeight: '700' as const,
    fontSize: isSmallDevice ? 20 : isTablet ? 26 : 22,
    lineHeight: isSmallDevice ? 26 : isTablet ? 32 : 28,
    letterSpacing: -0.3,
  },
  helpButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
  projectCard: {
    borderRadius: 12,
    backgroundColor: Colors.linen,
    borderWidth: normalizeBorder(0.5),
    borderColor: `rgba(139, 154, 123, ${normalizeBorderOpacity(0.12)})`,
    overflow: 'hidden',
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  projectImage: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.beige,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectInfo: {
    padding: 12,
  },
  projectTitle: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 15,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: Platform.select({ ios: 24, android: 24, default: 24 }),
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.sage,
    borderWidth: normalizeBorder(3),
    borderColor: Colors.deepSage,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },

  statusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },

  // Currently Working On styles
  activeSection: {
    backgroundColor: Colors.beige,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  activeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  activeSectionTitle: {
    ...Typography.body,
    color: Colors.deepTeal,
    fontWeight: '600' as const,
    fontSize: 15,
  },
  activeProjectsList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  activeProjectItem: {
    width: isSmallDevice ? 260 : isTablet ? 320 : 280,
  },
  activeProjectCard: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.deepTeal,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  activeProjectImage: {
    width: isSmallDevice ? 88 : isTablet ? 104 : 96,
    height: isSmallDevice ? 88 : isTablet ? 104 : 96,
    borderRadius: 10,
    margin: 10,
    backgroundColor: Colors.beige,
  },
  activeProjectInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 3,
  },
  activeProjectTitle: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: isSmallDevice ? 15 : 17,
    lineHeight: isSmallDevice ? 20 : 22,
  },
  activeProjectType: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontWeight: '500' as const,
    fontSize: isSmallDevice ? 13 : 14,
    lineHeight: isSmallDevice ? 17 : 19,
  },
  activeProjectDate: {
    ...Typography.caption,
    color: Colors.deepTeal,
    fontWeight: '400' as const,
    fontSize: isSmallDevice ? 12 : 13,
    lineHeight: isSmallDevice ? 16 : 17,
    opacity: 0.8,
  },

  // Active project card highlight in main grid
  projectCardActive: {
    borderWidth: 2,
    borderColor: Colors.deepTeal,
  },
  activeIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.deepTeal,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.deepTeal,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
});