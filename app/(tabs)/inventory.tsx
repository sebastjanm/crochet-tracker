import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { Plus, Package, Volleyball, Grid3x3, Wrench, HelpCircle } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { SearchableFilterBar } from '@/components/SearchableFilterBar';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { InventoryItem, getImageSource } from '@/types';
import { normalizeBorder, normalizeBorderOpacity, cardShadow, buttonShadow } from '@/constants/pixelRatio';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;

export default function InventoryScreen() {
  const { items, yarnCount, hookCount } = useInventory();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'yarn' | 'hook' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items
    .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
    .filter(item => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.name?.toLowerCase().includes(query) ||
        item.yarnDetails?.brand?.name?.toLowerCase().includes(query) ||
        item.hookDetails?.brand?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    });

  const categories = [
    { id: 'all', label: t('inventory.all'), count: items.length, icon: <Grid3x3 size={18} color={selectedCategory === 'all' ? Colors.white : Colors.deepSage} />, color: Colors.deepSage },
    { id: 'yarn', label: t('inventory.yarn'), count: yarnCount, icon: <Volleyball size={18} color={selectedCategory === 'yarn' ? Colors.white : Colors.filterYarn} />, color: Colors.filterYarn },
    { id: 'hook', label: t('inventory.hooks'), count: hookCount, icon: <Wrench size={18} color={selectedCategory === 'hook' ? Colors.white : Colors.sage} />, color: Colors.sage },
    { id: 'other', label: t('inventory.other'), count: items.filter(i => i.category === 'other').length, icon: <Package size={18} color={selectedCategory === 'other' ? Colors.white : Colors.filterOther} />, color: Colors.filterOther },
  ];

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const displayName = item.name || 'Untitled';
    const brandName = item.yarnDetails?.brand?.name || item.hookDetails?.brand || '';

    return (
      <TouchableOpacity
        style={styles.itemWrapper}
        onPress={() => router.push(`/inventory/${item.id}`)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${displayName}${brandName ? `, ${brandName}` : ''}, ${item.quantity} items`}
        accessibilityHint={`View ${displayName} details`}
      >
        <View style={styles.itemCard}>
          {item.images && item.images.length > 0 ? (
            <Image source={getImageSource(item.images[0])} style={styles.itemImage} contentFit="cover" />
          ) : (
            <View style={[styles.itemImage, styles.placeholderImage]}>
              {item.category === 'yarn' ? (
                <Volleyball size={32} color={Colors.warmGray} />
              ) : item.category === 'hook' ? (
                <Wrench size={32} color={Colors.warmGray} />
              ) : (
                <Package size={32} color={Colors.warmGray} />
              )}
            </View>
          )}
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityBadgeText}>{item.quantity}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {displayName}
            </Text>
            {brandName ? (
              <Text style={styles.itemBrand} numberOfLines={1}>
                {brandName}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.customHeader}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                {t('inventory.title')}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                {t('inventory.manageYourSupplies')}
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

      <SearchableFilterBar
        filters={categories}
        selectedFilter={selectedCategory}
        onFilterChange={(id) => setSelectedCategory(id as 'all' | 'yarn' | 'hook' | 'other')}
        searchPlaceholder={t('common.searchInventory')}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <View style={styles.container}>
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Package size={64} color={Colors.warmGray} />}
          title={selectedCategory === 'all' && !searchQuery ? t('inventory.noItems') : t('inventory.noItemsInCategory')}
          description={selectedCategory === 'all' && !searchQuery ? t('inventory.addYourSupplies') : t('inventory.tryDifferentFilter')}
          action={
            <Button
              title={selectedCategory === 'all' && !searchQuery ? t('inventory.addFirstItem') : t('inventory.addItem')}
              icon={<Plus size={20} color={Colors.white} />}
              onPress={() => router.push('/add-inventory')}
              size="large"
            />
          }
        />
      ) : (
        <FlatList
          key={selectedCategory}
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
          numColumns={2}
          columnWrapperStyle={styles.row}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}

        {items.length > 0 && (
          <TouchableOpacity
            style={[styles.fab, { bottom: 24 + insets.bottom }]}
            onPress={() => router.push('/add-inventory')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('inventory.addItem')}
            accessibilityHint={t('inventory.addNewItemToInventory')}
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
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallDevice ? 16 : isTablet ? 32 : 20,
    paddingVertical: isSmallDevice ? 12 : 16,
    maxWidth: isTablet ? 1200 : '100%',
    alignSelf: 'center',
    width: '100%',
    height: isSmallDevice ? 72 : isTablet ? 92 : 96,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  headerTitle: {
    ...Typography.title1,
    color: Colors.charcoal,
    fontWeight: '700' as const,
    fontSize: isSmallDevice ? 24 : isTablet ? 32 : 28,
    lineHeight: isSmallDevice ? 30 : isTablet ? 38 : 34,
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
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  itemWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  itemCard: {
    width: '100%',
    backgroundColor: Colors.linen,
    borderRadius: 12,
    borderWidth: normalizeBorder(0.5),
    borderColor: `rgba(139, 154, 123, ${normalizeBorderOpacity(0.12)})`,
    overflow: 'hidden',
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  itemImage: {
    width: '100%',
    height: 140,
  },
  placeholderImage: {
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.deepSage,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 12,
    lineHeight: 14,
  },
  itemInfo: {
    padding: 10,
  },
  itemTitle: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2,
  },
  itemBrand: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  itemQuantity: {
    ...Typography.caption,
    color: Colors.sage,
    fontWeight: '600' as const,
    fontSize: 12,
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
});