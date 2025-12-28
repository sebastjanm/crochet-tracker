import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { ChevronRight, Minus, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder } from '@/constants/pixelRatio';
import { useImageActions } from '@/hooks/useImageActions';
import { useLanguage } from '@/providers/LanguageProvider';
import type { InventoryItem } from '@/types';
import { getImageSource } from '@/types';

interface SelectedMaterialsPreviewProps {
  items: InventoryItem[];
  onRemove: (id: string) => void;
  emptyText?: string;
  /** Hide empty state entirely - cleaner when section header already has an add action */
  hideEmptyState?: boolean;
  category: 'yarn' | 'hook';
  // Yarn quantity tracking (optional)
  quantities?: Record<string, number>; // itemId -> quantity
  onQuantityChange?: (id: string, quantity: number) => void;
}

export function SelectedMaterialsPreview({
  items,
  onRemove,
  emptyText,
  hideEmptyState = false,
  category,
  quantities,
  onQuantityChange,
}: SelectedMaterialsPreviewProps) {
  const { showImageActions } = useImageActions();
  const { t } = useLanguage();

  const handleLongPress = (item: InventoryItem) => {
    showImageActions({
      canSetDefault: false,
      canViewFullSize: true,
      onViewFullSize: () => {
        router.push(`/inventory/${item.id}`);
      },
      onRemoveFromProject: () => onRemove(item.id),
    });
  };

  const renderRightActions = (itemId: string) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => onRemove(itemId)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={t('common.remove')}
    >
      <Text style={styles.deleteActionText}>{t('common.remove')}</Text>
    </TouchableOpacity>
  );

  if (items.length === 0) {
    // When section header already has obvious "Add" action, hide empty state for cleaner UI
    if (hideEmptyState) {
      return null;
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {emptyText || t('projects.noMaterialsSelected')}
        </Text>
      </View>
    );
  }

  // Hooks: Vertical list layout
  if (category === 'hook') {
    return (
      <View style={styles.hooksList}>
        {items.map((item, index) => {
          const image = item.images?.[0];
          const isLast = index === items.length - 1;

          // Get subtitle for hook
          const subtitleParts: string[] = [];
          if (item.hookDetails?.brand) subtitleParts.push(item.hookDetails.brand);
          if (item.hookDetails?.material) subtitleParts.push(item.hookDetails.material);
          const subtitle = subtitleParts.join(' · ');

          return (
            <Swipeable
              key={item.id}
              renderRightActions={() => renderRightActions(item.id)}
              overshootRight={false}
            >
              <Pressable
                style={[styles.hookRow, !isLast && styles.hookRowBorder]}
                onPress={() => router.push(`/inventory/${item.id}`)}
                onLongPress={() => handleLongPress(item)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${item.hookDetails?.size || item.name}${subtitle ? `, ${subtitle}` : ''}`}
                accessibilityHint={t('materials.longPressForOptions')}
              >
                {image ? (
                  <Image
                    source={getImageSource(image)}
                    style={styles.hookThumb}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.hookThumb, styles.hookThumbPlaceholder]}>
                    <Text style={styles.hookPlaceholderText}>
                      {item.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.hookInfo}>
                  <Text style={styles.hookName} numberOfLines={1}>
                    {item.hookDetails?.size || item.name}
                  </Text>
                  {subtitle && (
                    <Text style={styles.hookSubtitle} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}
                </View>
                <ChevronRight size={18} color={Colors.warmGray} />
              </Pressable>
            </Swipeable>
          );
        })}
      </View>
    );
  }

  // Yarn: Vertical list layout with optional quantity controls
  return (
    <View style={styles.hooksList}>
      {items.map((item, index) => {
        const image = item.images?.[0];
        const isLast = index === items.length - 1;
        const quantity = quantities?.[item.id] ?? 1;

        // Get subtitle for yarn
        const subtitleParts: string[] = [];
        if (item.yarnDetails?.brand?.name) subtitleParts.push(item.yarnDetails.brand.name);
        if (item.yarnDetails?.colorName) subtitleParts.push(item.yarnDetails.colorName);
        const subtitle = subtitleParts.join(' · ');

        return (
          <Swipeable
            key={item.id}
            renderRightActions={() => renderRightActions(item.id)}
            overshootRight={false}
          >
            <Pressable
              style={[styles.hookRow, !isLast && styles.hookRowBorder]}
              onPress={() => router.push(`/inventory/${item.id}`)}
              onLongPress={() => handleLongPress(item)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}${subtitle ? `, ${subtitle}` : ''}, quantity ${quantity}`}
              accessibilityHint={t('materials.longPressForOptions')}
            >
              {image ? (
                <Image
                  source={getImageSource(image)}
                  style={styles.hookThumb}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[styles.hookThumb, styles.hookThumbPlaceholder]}>
                  <Text style={styles.hookPlaceholderText}>
                    {item.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.hookInfo}>
                <Text style={styles.hookName} numberOfLines={1}>
                  {item.name}
                </Text>
                {subtitle && (
                  <Text style={styles.hookSubtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>
              {/* Quantity controls for yarn (only when onQuantityChange is provided) */}
              {onQuantityChange ? (
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                    onPress={() => quantity > 1 && onQuantityChange(item.id, quantity - 1)}
                    disabled={quantity <= 1}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.decrease')}
                  >
                    <Minus size={16} color={quantity <= 1 ? Colors.warmGray : Colors.white} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => onQuantityChange(item.id, quantity + 1)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.increase')}
                  >
                    <Plus size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <ChevronRight size={18} color={Colors.warmGray} />
              )}
            </Pressable>
          </Swipeable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Common
  emptyContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 14,
    textAlign: 'center',
  },

  // Materials: Vertical list (used for both yarn and hooks)
  hooksList: {
    marginVertical: 8,
  },
  hookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 80,
    gap: 12,
  },
  hookRowBorder: {
    borderBottomWidth: normalizeBorder(1),
    borderBottomColor: Colors.border,
  },
  hookThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: Colors.linen,
  },
  hookThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hookPlaceholderText: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontWeight: '600',
    fontSize: 14,
  },
  hookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hookName: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  hookSubtitle: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.warmGray,
    marginTop: 2,
  },

  // Swipe-to-delete action
  deleteAction: {
    backgroundColor: '#FF3B30', // iOS system red
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteActionText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
  },

  // Quantity controls
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: Colors.border,
  },
  quantityText: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.charcoal,
    minWidth: 28,
    textAlign: 'center',
  },
});
