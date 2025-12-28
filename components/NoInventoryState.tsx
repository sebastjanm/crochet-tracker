/**
 * NoInventoryState - Specialized empty state for inventory list
 *
 * Centralizes the "No Inventory Items" UI so changes propagate everywhere.
 * Handles both "no items at all" and "no items matching filter" states.
 */

import React from 'react';
import { router } from 'expo-router';
import { Plus, Package } from 'lucide-react-native';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { useLanguage } from '@/providers/LanguageProvider';
import { Colors } from '@/constants/colors';

interface NoInventoryStateProps {
  /** Whether a filter/search is currently active */
  isFiltered?: boolean;
}

export function NoInventoryState({ isFiltered = false }: NoInventoryStateProps) {
  const { t } = useLanguage();

  if (isFiltered) {
    // Filtered state: user has applied a filter but no results
    return (
      <EmptyState
        icon={<Package size={64} color={Colors.warmGray} />}
        title={t('inventory.noItemsInCategory')}
        description={t('inventory.tryDifferentFilter')}
        action={
          <Button
            title={t('inventory.addItem')}
            icon={<Plus size={20} color={Colors.white} />}
            onPress={() => router.push('/add-inventory')}
            size="large"
          />
        }
      />
    );
  }

  // Default state: no inventory items at all
  return (
    <EmptyState
      icon={<Package size={64} color={Colors.warmGray} />}
      title={t('inventory.noItems')}
      description={t('inventory.addYourSupplies')}
      action={
        <Button
          title={t('inventory.addFirstItem')}
          icon={<Plus size={20} color={Colors.white} />}
          onPress={() => router.push('/add-inventory')}
          size="large"
        />
      }
    />
  );
}
