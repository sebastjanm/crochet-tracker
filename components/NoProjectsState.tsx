/**
 * NoProjectsState - Specialized empty state for projects list
 *
 * Centralizes the "No Projects" UI so changes propagate everywhere.
 * Handles both "no projects at all" and "no projects matching filter" states.
 */

import React from 'react';
import { router } from 'expo-router';
import { Plus, Volleyball } from 'lucide-react-native';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { useLanguage } from '@/providers/LanguageProvider';
import { Colors } from '@/constants/colors';

interface NoProjectsStateProps {
  /** Whether a filter/search is currently active */
  isFiltered?: boolean;
}

export function NoProjectsState({ isFiltered = false }: NoProjectsStateProps) {
  const { t } = useLanguage();

  if (isFiltered) {
    // Filtered state: user has applied a filter but no results
    return (
      <EmptyState
        icon={<Volleyball size={64} color={Colors.warmGray} />}
        title={t('projects.noProjectsInCategory')}
        description={t('projects.tryDifferentFilter')}
        action={
          <Button
            title={t('projects.addProject')}
            icon={<Plus size={20} color={Colors.white} />}
            onPress={() => router.push('/add-project')}
            size="large"
          />
        }
      />
    );
  }

  // Default state: no projects at all
  return (
    <EmptyState
      icon={<Volleyball size={64} color={Colors.warmGray} />}
      title={t('projects.noProjects')}
      description={t('projects.startFirstProject')}
      action={
        <Button
          title={t('projects.addFirstProject')}
          icon={<Plus size={20} color={Colors.white} />}
          onPress={() => router.push('/add-project')}
          size="large"
        />
      }
    />
  );
}
