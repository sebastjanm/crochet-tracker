import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Plus, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useImageActions } from '@/hooks/useImageActions';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { InventoryItem } from '@/types';

interface MaterialCardSelectorProps {
  items: InventoryItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onAddNew: () => void;
  onRemoveFromProject?: (id: string) => void;
  category: 'yarn' | 'hook';
  title: string;
  addButtonLabel: string;
  emptyMessage: string;
  showTitle?: boolean;
  showAddCard?: boolean;
}

export function MaterialCardSelector({
  items,
  selectedIds,
  onToggle,
  onAddNew,
  onRemoveFromProject,
  category,
  title,
  addButtonLabel,
  emptyMessage,
  showTitle = true,
  showAddCard = true,
}: MaterialCardSelectorProps) {
  const isSelected = (id: string) => selectedIds.includes(id);
  const { showImageActions } = useImageActions();
  const { t } = useLanguage();

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const selected = isSelected(item.id);
    const image = item.images && item.images.length > 0 ? item.images[0] : undefined;

    // Get subtitle based on category
    let subtitle = '';
    if (category === 'yarn' && item.yarnDetails) {
      subtitle = item.yarnDetails.brand || item.yarnDetails.weightCategory || '';
    } else if (category === 'hook' && item.hookDetails) {
      subtitle = item.hookDetails.sizeMm ? `${item.hookDetails.sizeMm}mm` : '';
    }

    return (
      <Pressable
        style={[
          styles.card,
          selected && styles.cardSelected,
        ]}
        onPress={() => onToggle(item.id)}
        onLongPress={() => {
          showImageActions({
            canSetDefault: false,
            canViewFullSize: true,
            onViewFullSize: () => {
              router.push(`/inventory/${item.id}`);
            },
            onRemoveFromProject: onRemoveFromProject ? () => onRemoveFromProject(item.id) : undefined,
          });
        }}
        accessible={true}
        accessibilityRole="checkbox"
        accessibilityLabel={item.name}
        accessibilityState={{ checked: selected }}
        accessibilityHint={t('materials.longPressForOptions')}
      >
        <View style={styles.imageContainer}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>
                {item.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          {selected && (
            <View style={styles.selectedBadge}>
              <CheckCircle size={16} color={Colors.white} fill={Colors.deepTeal} />
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>
          {subtitle && (
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  const renderAddCard = () => (
    <TouchableOpacity
      style={styles.addCard}
      onPress={onAddNew}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={addButtonLabel}
    >
      <View style={styles.addCardIcon}>
        <Plus size={32} color={Colors.sage} />
      </View>
      <Text style={styles.addCardText}>{addButtonLabel}</Text>
    </TouchableOpacity>
  );

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        {showTitle && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={onAddNew}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={addButtonLabel}
          >
            <Plus size={20} color={Colors.sage} />
            <Text style={styles.emptyAddButtonText}>{addButtonLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {selectedIds.length > 0 && (
            <Text style={styles.selectedCount}>
              {selectedIds.length} selected
            </Text>
          )}
        </View>
      )}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListFooterComponent={showAddCard ? renderAddCard : null}
      />
    </View>
  );
}

const CARD_WIDTH = 100;
const IMAGE_HEIGHT = 133; // 3:4 aspect ratio (100 * 4/3)

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '600',
    fontSize: 17,
  },
  selectedCount: {
    ...Typography.caption,
    color: Colors.sage,
    fontWeight: '600',
  },
  list: {
    paddingVertical: 8,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.linen,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(139, 154, 123, 0.12)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#2D2D2D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: Colors.deepTeal,
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: {
        shadowColor: Colors.deepTeal,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.deepTeal,
    borderRadius: 12,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  imagePlaceholder: {
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...Typography.title2,
    color: Colors.sage,
    fontWeight: '600',
  },
  cardContent: {
    padding: 8,
    minHeight: 48,
  },
  cardTitle: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 16,
    marginBottom: 2,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 11,
    lineHeight: 14,
  },
  addCard: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT + 48,
    backgroundColor: Colors.beige,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.sage,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  addCardIcon: {
    marginBottom: 4,
  },
  addCardText: {
    ...Typography.caption,
    color: Colors.sage,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    backgroundColor: Colors.beige,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.warmGray,
    textAlign: 'center',
    fontSize: 15,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: Colors.sage,
  },
  emptyAddButtonText: {
    ...Typography.body,
    color: Colors.sage,
    fontWeight: '600',
    fontSize: 15,
  },
});
