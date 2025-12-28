import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { ChevronRight, Link } from 'lucide-react-native';
import { useProjects } from '@/providers/ProjectsProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, cardShadow } from '@/constants/pixelRatio';

interface ProjectLinksSummaryProps {
  selectedProjectIds: string[];
  onPress: () => void;
  maxInlineNames?: number;
}

export function ProjectLinksSummary({
  selectedProjectIds,
  onPress,
  maxInlineNames = 2,
}: ProjectLinksSummaryProps) {
  const { projects } = useProjects();
  const { t } = useLanguage();

  const count = selectedProjectIds.length;

  // Get resolved project objects
  const selectedProjects = selectedProjectIds
    .map(id => projects.find(p => p.id === id))
    .filter(Boolean);

  // Check if any project is in-progress
  const hasActiveProject = selectedProjects.some(
    p => p?.status === 'in-progress' || p?.status === 'to-do'
  );

  // Generate display text based on count
  const getDisplayText = (): string => {
    if (count === 0) return '';

    if (count === 1) {
      return selectedProjects[0]?.title || t('inventory.oneProjectLinked');
    }

    if (count === 2) {
      const names = selectedProjects
        .slice(0, 2)
        .map(p => p?.title)
        .filter(Boolean)
        .join(', ');
      return names || `${count} ${t('projects.projects').toLowerCase()}`;
    }

    if (count <= 5) {
      const firstName = selectedProjects[0]?.title;
      if (firstName) {
        return `${firstName}  ·  +${count - 1} ${t('common.more').toLowerCase()}`;
      }
      return `${count} ${t('projects.projects').toLowerCase()}`;
    }

    // 6+ projects
    return t('inventory.projectsLinked', { count });
  };

  // Empty state
  if (count === 0) {
    return (
      <TouchableOpacity
        style={styles.emptyContainer}
        onPress={onPress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={t('inventory.linkToProjects')}
        accessibilityHint={t('inventory.usedInProjectsHint')}
      >
        <Link size={18} color={Colors.sage} strokeWidth={2} />
        <Text style={styles.emptyText}>
          {t('inventory.linkToProjects')}
        </Text>
      </TouchableOpacity>
    );
  }

  // Filled state
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${t('inventory.linkedProjects')}: ${count}. ${t('common.tapToEdit')}`}
      accessibilityHint={t('inventory.usedInProjectsHint')}
    >
      {/* Status dot - shows if any project is active */}
      {hasActiveProject && <View style={styles.statusDot} />}

      {/* Project text */}
      <Text style={styles.text} numberOfLines={1}>
        {getDisplayText()}
      </Text>

      {/* Count badge - only show for 3+ */}
      {count >= 3 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}

      {/* Chevron */}
      <ChevronRight size={20} color={Colors.warmGray} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 56,
    gap: 10,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.sage,
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 56,
    gap: 8,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.sage,
    fontWeight: '600',
    fontSize: 15,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sage,
  },
  text: {
    ...Typography.body,
    color: Colors.charcoal,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  countBadge: {
    backgroundColor: Colors.sage,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  countText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
