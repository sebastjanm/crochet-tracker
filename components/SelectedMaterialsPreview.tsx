import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useImageActions } from '@/hooks/useImageActions';
import { useLanguage } from '@/hooks/language-context';
import type { InventoryItem } from '@/types';
import { getImageSource } from '@/types';

interface SelectedMaterialsPreviewProps {
  items: InventoryItem[];
  onRemove: (id: string) => void;
  emptyText?: string;
  category: 'yarn' | 'hook';
}

const CARD_WIDTH = 140;
const IMAGE_HEIGHT = 187; // 3:4 aspect ratio (matches project details)

export function SelectedMaterialsPreview({
  items,
  onRemove,
  emptyText,
  category,
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

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {emptyText || t('projects.noMaterialsSelected')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {items.map((item) => {
        const image = item.images?.[0];

        // Get subtitle based on category
        let subtitle = '';
        if (category === 'yarn' && item.yarnDetails) {
          const parts: string[] = [];
          if (item.yarnDetails.brand?.name) parts.push(item.yarnDetails.brand.name);
          if (item.yarnDetails.colorName) parts.push(item.yarnDetails.colorName);
          subtitle = parts.join(' · ');
        } else if (category === 'hook' && item.hookDetails) {
          const parts: string[] = [];
          if (item.hookDetails.sizeMm) parts.push(`${item.hookDetails.sizeMm}mm`);
          if (item.hookDetails.brand) parts.push(item.hookDetails.brand);
          subtitle = parts.join(' · ');
        }

        return (
          <Pressable
            key={item.id}
            style={styles.card}
            onLongPress={() => handleLongPress(item)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}${subtitle ? `, ${subtitle}` : ''}`}
            accessibilityHint={t('materials.longPressForOptions')}
          >
            <View style={styles.imageContainer}>
              {image ? (
                <Image
                  source={getImageSource(image)}
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
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemove(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('common.remove')}
              >
                <X size={14} color={Colors.white} strokeWidth={2.5} />
              </TouchableOpacity>
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
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  content: {
    paddingVertical: 8,
    gap: 12,
  },
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
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.deepTeal,
    overflow: 'hidden',
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
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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
});
