import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { X, Check, Search, Package } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import { useImageActions } from '@/hooks/useImageActions';
import type { InventoryItem } from '@/types';
import { getImageSource } from '@/types';

interface MaterialPickerModalProps {
  visible: boolean;
  onClose: () => void;
  category: 'yarn' | 'hook';
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  title?: string;
}

// Yarn weight filters
const YARN_WEIGHTS = [
  { key: 'all', label: 'All' },
  { key: 'lace', label: 'Lace' },
  { key: 'fingering', label: 'Fingering' },
  { key: 'sport', label: 'Sport' },
  { key: 'dk', label: 'DK' },
  { key: 'worsted', label: 'Worsted' },
  { key: 'aran', label: 'Aran' },
  { key: 'bulky', label: 'Bulky' },
];

// Hook size filters (in mm ranges)
const HOOK_SIZES = [
  { key: 'all', label: 'All' },
  { key: '1-2', label: '1-2mm', min: 1, max: 2 },
  { key: '2-3', label: '2-3mm', min: 2, max: 3 },
  { key: '3-4', label: '3-4mm', min: 3, max: 4 },
  { key: '4-5', label: '4-5mm', min: 4, max: 5 },
  { key: '5-6', label: '5-6mm', min: 5, max: 6 },
  { key: '6+', label: '6mm+', min: 6, max: 100 },
];

function MaterialListItem({
  item,
  isSelected,
  onToggle,
  onLongPress,
  category,
}: {
  item: InventoryItem;
  isSelected: boolean;
  onToggle: () => void;
  onLongPress: () => void;
  category: 'yarn' | 'hook';
}) {
  const image = item.images?.[0];

  // Get subtitle based on category
  const getSubtitle = () => {
    if (category === 'yarn') {
      const parts: string[] = [];
      if (item.yarnDetails?.brand?.name) parts.push(item.yarnDetails.brand.name);
      if (item.yarnDetails?.colorName) parts.push(item.yarnDetails.colorName);
      if (item.yarnDetails?.weight?.name) parts.push(item.yarnDetails.weight.name);
      return parts.join(' · ') || undefined;
    } else {
      const parts: string[] = [];
      if (item.hookDetails?.size) parts.push(item.hookDetails.size);
      if (item.hookDetails?.brand) parts.push(item.hookDetails.brand);
      if (item.hookDetails?.material) parts.push(item.hookDetails.material);
      return parts.join(' · ') || undefined;
    }
  };

  const subtitle = getSubtitle();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.option,
        pressed && styles.optionPressed,
        isSelected && styles.optionSelected,
      ]}
      onPress={onToggle}
      onLongPress={onLongPress}
      accessible={true}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${item.name}${subtitle ? `, ${subtitle}` : ''}`}
      accessibilityHint="Long press for more options"
    >
      <View style={styles.optionContent}>
        {image ? (
          <Image
            source={getImageSource(image)}
            style={styles.optionImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.optionImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>
              {item.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.optionText}>
          <Text
            style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {subtitle && (
            <Text
              style={[styles.optionSubtitle, isSelected && styles.optionSubtitleSelected]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {isSelected && <Check size={24} color={Colors.white} strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

export function MaterialPickerModal({
  visible,
  onClose,
  category,
  selectedIds,
  onSelectionChange,
  title,
}: MaterialPickerModalProps) {
  const { getItemsByCategory } = useInventory();
  const { t } = useLanguage();
  const { showImageActions } = useImageActions();
  const [localSelection, setLocalSelection] = useState<string[]>(selectedIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Get all items for this category
  const allItems = useMemo(() => getItemsByCategory(category), [category, getItemsByCategory]);

  // Reset local state when modal opens
  React.useEffect(() => {
    if (visible) {
      setLocalSelection(selectedIds);
      setSearchQuery('');
      setActiveFilter('all');
    }
  }, [visible, selectedIds]);

  // Filter items by search query and weight/size filter
  const filteredItems = useMemo(() => {
    let items = allItems;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        if (item.name.toLowerCase().includes(query)) return true;
        if (category === 'yarn') {
          if (item.yarnDetails?.brand?.name?.toLowerCase().includes(query)) return true;
          if (item.yarnDetails?.colorName?.toLowerCase().includes(query)) return true;
          if (item.yarnDetails?.weight?.name?.toLowerCase().includes(query)) return true;
        } else {
          if (item.hookDetails?.brand?.toLowerCase().includes(query)) return true;
          if (item.hookDetails?.size?.toLowerCase().includes(query)) return true;
          if (item.hookDetails?.material?.toLowerCase().includes(query)) return true;
        }
        return false;
      });
    }

    // Apply category-specific filter
    if (activeFilter !== 'all') {
      if (category === 'yarn') {
        items = items.filter((item) => {
          const weight = item.yarnDetails?.weight?.name?.toLowerCase();
          return weight === activeFilter.toLowerCase();
        });
      } else {
        const sizeFilter = HOOK_SIZES.find((s) => s.key === activeFilter);
        if (sizeFilter && sizeFilter.min !== undefined) {
          items = items.filter((item) => {
            const sizeMm = item.hookDetails?.sizeMm;
            if (!sizeMm) return false;
            return sizeMm >= sizeFilter.min! && sizeMm < sizeFilter.max!;
          });
        }
      }
    }

    return items;
  }, [allItems, searchQuery, activeFilter, category]);

  const handleToggle = useCallback((itemId: string) => {
    setLocalSelection((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const handleLongPress = useCallback((item: InventoryItem) => {
    showImageActions({
      canSetDefault: false,
      canViewFullSize: true,
      onViewFullSize: () => {
        router.push(`/inventory/${item.id}`);
      },
    });
  }, [showImageActions]);

  const handleDone = () => {
    onSelectionChange(localSelection);
    onClose();
  };

  const handleCancel = () => {
    setLocalSelection(selectedIds);
    onClose();
  };

  const filters = category === 'yarn' ? YARN_WEIGHTS : HOOK_SIZES;
  const modalTitle = title || (category === 'yarn' ? t('projects.selectYarn') : t('projects.selectHooks'));

  const renderItem = useCallback(
    ({ item }: { item: InventoryItem }) => (
      <MaterialListItem
        item={item}
        isSelected={localSelection.includes(item.id)}
        onToggle={() => handleToggle(item.id)}
        onLongPress={() => handleLongPress(item)}
        category={category}
      />
    ),
    [localSelection, handleToggle, handleLongPress, category]
  );

  const keyExtractor = useCallback((item: InventoryItem) => item.id, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.modal} edges={['top']}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.modalButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            {localSelection.length > 0 && (
              <Text style={styles.selectedCount}>
                {localSelection.length} {t('common.selected')}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleDone}
            style={styles.modalButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('common.done')}
          >
            <Text style={styles.doneButtonText}>{t('common.done')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.warmGray} />
          <TextInput
            style={styles.searchInput}
            placeholder={category === 'yarn' ? t('projects.searchYarn') : t('projects.searchHooks')}
            placeholderTextColor={Colors.warmGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={Colors.warmGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter.key }}
              accessibilityLabel={filter.label}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter.key && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Material List */}
        {allItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={48} color={Colors.warmGray} />
            <Text style={styles.emptyText}>
              {category === 'yarn' ? t('projects.noYarnInInventory') : t('projects.noHooksInInventory')}
            </Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Search size={48} color={Colors.warmGray} />
            <Text style={styles.emptyText}>{t('common.noResultsFound')}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            windowSize={10}
            maxToRenderPerBatch={10}
            removeClippedSubviews={true}
            initialNumToRender={10}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalButton: {
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 16,
  },
  doneButtonText: {
    ...Typography.body,
    color: Colors.sage,
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  modalTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '600' as const,
  },
  selectedCount: {
    ...Typography.caption,
    color: Colors.sage,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 16,
    padding: 0,
  },
  filterContainer: {
    maxHeight: 48,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.sage,
  },
  filterChipText: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  option: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 72,
  },
  optionPressed: {
    backgroundColor: Colors.beige,
  },
  optionSelected: {
    backgroundColor: Colors.sage,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 72,
  },
  optionImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: Colors.beige,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 16,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  optionSubtitle: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 13,
  },
  optionSubtitleSelected: {
    color: Colors.white,
    opacity: 0.9,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.warmGray,
    textAlign: 'center',
  },
});
