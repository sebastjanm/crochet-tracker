import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function ProjectsScreen() {
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
  const { user } = useAuth();
  const { showToast } = useToast();

  const userName = user?.name?.split(' ')[0] || t('profile.defaultName');

  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredProjects = projects
    .filter(project => filter === 'all' || project.status === filter)
    .filter(project => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        project.title?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.notes?.toLowerCase().includes(query)
      );
    });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleLongPress = async (project: Project) => {
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
  };

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

  const renderProject = ({ item }: { item: Project }) => {
    const defaultImageIndex = item.defaultImageIndex ?? 0;
    const displayImage = item.images[defaultImageIndex] || item.images[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop';
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
          <Image
            source={getImageSource(displayImage)}
            style={styles.projectImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
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
  };

  const renderActiveProject = ({ item }: { item: Project }) => {
    const defaultImageIndex = item.defaultImageIndex ?? 0;
    const displayImage = item.images[defaultImageIndex] || item.images[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop';

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
          <Image
            source={getImageSource(displayImage)}
            style={styles.activeProjectImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          <View style={styles.activeProjectBadge}>
            <Zap size={12} color={Colors.white} fill={Colors.white} />
          </View>
          <View style={styles.activeProjectInfo}>
            <Text style={styles.activeProjectTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const statusFilters = [
    { key: 'all', label: t('projects.all'), count: projects.length, icon: <Volleyball size={18} color={filter === 'all' ? Colors.white : Colors.deepSage} />, color: Colors.deepSage },
    { key: 'to-do', label: t('projects.toDo'), count: toDoCount, icon: <Lightbulb size={18} color={filter === 'to-do' ? Colors.white : Colors.filterToDo} />, color: Colors.filterToDo },
    { key: 'in-progress', label: t('projects.inProgress'), count: inProgressCount, icon: <Clock size={18} color={filter === 'in-progress' ? Colors.white : Colors.filterInProgress} />, color: Colors.filterInProgress },
    { key: 'on-hold', label: t('projects.onHold'), count: onHoldCount, icon: <PauseCircle size={18} color={filter === 'on-hold' ? Colors.white : Colors.filterOnHold} />, color: Colors.filterOnHold },
    { key: 'completed', label: t('projects.completed'), count: completedCount, icon: <CheckCircle size={18} color={filter === 'completed' ? Colors.white : Colors.filterCompleted} />, color: Colors.filterCompleted },
    { key: 'frogged', label: t('projects.frogged'), count: froggedCount, icon: <RotateCcw size={18} color={filter === 'frogged' ? Colors.white : Colors.filterFrogged} />, color: Colors.filterFrogged },
  ];

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.customHeader}>
          <View style={styles.headerContent}>
            <Avatar user={user || undefined} size={isSmallDevice ? 44 : isTablet ? 52 : 56} />
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
      
      {/* Currently Working On Section */}
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

      <SearchableFilterBar
        filters={statusFilters.map(f => ({ id: f.key, label: f.label, count: f.count, icon: f.icon, color: f.color }))}
        selectedFilter={filter}
        onFilterChange={(id) => setFilter(id as ProjectStatus | 'all')}
        searchPlaceholder={t('common.searchProjects')}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <View style={styles.container}>
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
          contentContainerStyle={styles.list}
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
          style={styles.fab}
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
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 22,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: Colors.sage,
    minHeight: 90,
    ...Platform.select({
      ios: {
        shadowColor: Colors.sage,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  statCardActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.deepSage,
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: Colors.sage,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        transform: [{ scale: 1.03 }],
      },
      android: {
        elevation: 7,
      },
      default: {},
    }),
  },
  statNumber: {
    ...Typography.title1,
    color: Colors.deepSage,
    marginBottom: 8,
    fontWeight: '800' as const,
    fontSize: 32,
  },
  statNumberActive: {
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.deepSage,
    fontWeight: '700' as const,
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  statLabelActive: {
    color: Colors.white,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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
    height: 140,
    backgroundColor: Colors.beige,
  },
  projectInfo: {
    padding: 10,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  projectTitle: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 14,
    lineHeight: 18,
  },
  projectStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.warmGray,
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
    backgroundColor: Colors.headerBg,
    paddingTop: 8,
    paddingBottom: 12,
  },
  activeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  activeSectionTitle: {
    ...Typography.body,
    color: Colors.deepTeal,
    fontWeight: '600' as const,
    fontSize: 15,
  },
  activeProjectsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  activeProjectItem: {
    width: 120,
  },
  activeProjectCard: {
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.deepTeal,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.deepTeal,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  activeProjectImage: {
    width: '100%',
    height: 80,
    backgroundColor: Colors.beige,
  },
  activeProjectBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.deepTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeProjectInfo: {
    padding: 8,
  },
  activeProjectTitle: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 12,
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