/**
 * Skeleton Loading Component
 *
 * Provides shimmer placeholder animations for perceived faster loading.
 * Use instead of ActivityIndicator for list items and cards.
 */

import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
}

/**
 * Basic skeleton box with shimmer animation
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Skeleton for project cards in 2-column grid
 */
export function ProjectCardSkeleton() {
  return (
    <View style={styles.projectCard}>
      <Skeleton height={160} borderRadius={0} />
      <View style={styles.projectCardInfo}>
        <Skeleton width="80%" height={18} borderRadius={4} />
        <Skeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

/**
 * Skeleton for inventory items in 2-column grid
 */
export function InventoryCardSkeleton() {
  return (
    <View style={styles.inventoryCard}>
      <Skeleton height={140} borderRadius={0} />
      <View style={styles.inventoryCardInfo}>
        <Skeleton width="75%" height={16} borderRadius={4} />
        <Skeleton width="50%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/**
 * Full skeleton grid for projects list
 */
export function ProjectsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.gridContainer}>
      <View style={styles.grid}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.gridItem}>
            <ProjectCardSkeleton />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Full skeleton grid for inventory list
 */
export function InventoryListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.gridContainer}>
      <View style={styles.grid}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.gridItem}>
            <InventoryCardSkeleton />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Horizontal skeleton for "currently working on" section
 */
export function ActiveProjectsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <View style={styles.activeSection}>
      <View style={styles.activeSectionHeader}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={150} height={18} borderRadius={4} style={{ marginLeft: 8 }} />
      </View>
      <View style={styles.activeProjectsList}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.activeProjectCard}>
            <Skeleton
              width={isSmallDevice ? 88 : 96}
              height={isSmallDevice ? 88 : 96}
              borderRadius={10}
            />
            <View style={styles.activeProjectInfo}>
              <Skeleton width="90%" height={18} borderRadius={4} />
              <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
              <Skeleton width="40%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  gridContainer: {
    flex: 1,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
  projectCard: {
    backgroundColor: Colors.linen,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  projectCardInfo: {
    padding: 12,
  },
  inventoryCard: {
    backgroundColor: Colors.linen,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inventoryCardInfo: {
    padding: 10,
  },
  activeSection: {
    backgroundColor: Colors.beige,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  activeProjectsList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 14,
  },
  activeProjectCard: {
    flexDirection: 'row',
    width: isSmallDevice ? 260 : 280,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 10,
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
    }),
  },
  activeProjectInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 14,
  },
});
