import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;
import { router } from 'expo-router';
import { Plus, Clock, CheckCircle, Lightbulb, Calendar, Volleyball, HelpCircle, PauseCircle, RotateCcw } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Avatar } from '@/components/Avatar';
import { useProjects } from '@/hooks/projects-context';
import { useLanguage } from '@/hooks/language-context';
import { useAuth } from '@/hooks/auth-context';

import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Project, ProjectStatus } from '@/types';

export default function ProjectsScreen() {
  const { projects, planningCount, inProgressCount, onHoldCount, completedCount, froggedCount } = useProjects();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const userName = user?.name || 'User';
  const initials = getInitials(userName);

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'planning':
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
      case 'planning':
        return '#FFB84D'; // Warm orange
      case 'in-progress':
        return '#2C7873'; // Deep teal
      case 'on-hold':
        return '#9C27B0'; // Purple
      case 'completed':
        return '#4CAF50'; // Green
      case 'frogged':
        return '#FF6B6B'; // Coral red
    }
  };

  const renderProject = ({ item }: { item: Project }) => {
    const defaultImageIndex = item.defaultImageIndex ?? 0;
    const displayImage = item.images[defaultImageIndex] || item.images[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop';
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/project/${item.id}`)}
        activeOpacity={0.8}
        style={styles.gridItem}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} project`}
        accessibilityHint={`View details for ${item.title}`}
      >
        <View style={styles.projectCard}>
          <Image 
            source={{ uri: displayImage }} 
            style={styles.projectImage} 
          />
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]}>
          {getStatusIcon(item.status)}
        </View>
        <View style={styles.overlay}>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.projectDescription} numberOfLines={1}>
              {item.description}
            </Text>
          </View>
        </View>
        </View>
      </TouchableOpacity>
    );
  };

  const statusFilters = [
    { key: 'all', label: t('projects.all'), count: projects.length, icon: <Volleyball size={18} color={filter === 'all' ? Colors.white : Colors.deepSage} />, color: Colors.deepSage },
    { key: 'planning', label: t('projects.planning'), count: planningCount, icon: <Lightbulb size={18} color={filter === 'planning' ? Colors.white : '#FFB84D'} />, color: '#FFB84D' },
    { key: 'in-progress', label: t('projects.inProgress'), count: inProgressCount, icon: <Clock size={18} color={filter === 'in-progress' ? Colors.white : '#2C7873'} />, color: '#2C7873' },
    { key: 'on-hold', label: t('projects.onHold'), count: onHoldCount, icon: <PauseCircle size={18} color={filter === 'on-hold' ? Colors.white : '#9C27B0'} />, color: '#9C27B0' },
    { key: 'completed', label: t('projects.completed'), count: completedCount, icon: <CheckCircle size={18} color={filter === 'completed' ? Colors.white : '#4CAF50'} />, color: '#4CAF50' },
    { key: 'frogged', label: t('projects.frogged'), count: froggedCount, icon: <RotateCcw size={18} color={filter === 'frogged' ? Colors.white : '#FF6B6B'} />, color: '#FF6B6B' },
  ];

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.customHeader}>
          <View style={styles.headerContent}>
            <Avatar user={user || undefined} size={isSmallDevice ? 44 : isTablet ? 52 : 56} />
            <View style={styles.textContainer}>
              <Text style={styles.headerGreeting} numberOfLines={1} ellipsizeMode="tail">
                {t('home.greeting')}, {userName}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                {t('projects.manageYourProjects')}
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
      
      <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {statusFilters.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.categoryChip,
              filter === item.key && [styles.categoryChipActive, { backgroundColor: item.color }]
            ]}
            onPress={() => setFilter(item.key as ProjectStatus | 'all')}
            activeOpacity={0.75}
            accessible={true}
            accessibilityRole="radio"
            accessibilityLabel={item.label}
            accessibilityHint={`Show ${item.label.toLowerCase()} projects`}
            accessibilityState={{
              selected: filter === item.key,
              checked: filter === item.key,
            }}
          >
            {item.icon}
            <Text style={[
              styles.categoryLabel,
              filter === item.key && styles.categoryLabelActive
            ]}>
              {item.label}
            </Text>
            <Text style={[
              styles.categoryCount,
              filter === item.key && [styles.categoryCountActive, { borderColor: item.color }]
            ]}>
              {item.count}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={<Volleyball size={64} color={Colors.warmGray} />}
          title={filter === 'all' ? t('projects.noProjects') : t('projects.noProjectsInCategory')}
          description={filter === 'all' ? t('projects.startFirstProject') : t('projects.tryDifferentFilter')}
          action={
            filter === 'all' ? (
              <Button
                title={t('projects.addFirstProject')}
                icon={<Plus size={20} color={Colors.white} />}
                onPress={() => router.push('/add-project')}
                size="large"
              />
            ) : undefined
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
    backgroundColor: Colors.cream,
  },
  safeArea: {
    backgroundColor: Colors.cream,
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
    paddingHorizontal: isSmallDevice ? 16 : isTablet ? 32 : 20,
    paddingVertical: isSmallDevice ? 12 : 16,
    gap: isSmallDevice ? 12 : 16,
    maxWidth: isTablet ? 1200 : '100%',
    alignSelf: 'center',
    width: '100%',
    minHeight: 56,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
    minWidth: 0,
  },
  headerGreeting: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontWeight: '700' as const,
    fontSize: isSmallDevice ? 20 : isTablet ? 28 : 24,
    lineHeight: isSmallDevice ? 26 : isTablet ? 34 : 30,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '500' as const,
    lineHeight: isSmallDevice ? 17 : 18,
    opacity: 0.9,
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
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  categoriesContainer: {
    maxHeight: 80,
    backgroundColor: Colors.beige,
    marginTop: 12,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 26,
    marginRight: 12,
    borderWidth: 2.5,
    borderColor: Colors.sage,
    gap: 10,
    minHeight: 50,
    ...Platform.select({
      ios: {
        shadowColor: Colors.sage,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  categoryChipActive: {
    borderColor: Colors.deepSage,
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: Colors.sage,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        transform: [{ scale: 1.03 }],
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  categoryLabel: {
    ...Typography.body,
    color: Colors.deepSage,
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: -0.1,
  },
  categoryLabelActive: {
    color: Colors.white,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  categoryCount: {
    ...Typography.caption,
    color: Colors.white,
    backgroundColor: Colors.deepSage,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    fontSize: 14,
    fontWeight: '700' as const,
    minWidth: 28,
    textAlign: 'center',
    lineHeight: 20,
    borderWidth: 1,
    borderColor: Colors.sage,
  },
  categoryCountActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: Colors.deepSage,
    fontWeight: '800' as const,
    borderColor: 'rgba(255,255,255,0.3)',
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
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: {
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  projectImage: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.beige,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
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
  projectInfo: {
    marginTop: 8,
  },
  projectTitle: {
    ...Typography.title3,
    color: Colors.white,
    fontWeight: '700' as const,
    marginBottom: 4,
    fontSize: 16,
  },
  projectDescription: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
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
    borderWidth: 3,
    borderColor: Colors.deepSage,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
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
});