import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { Plus, Package, Volleyball, Grid3x3, Wrench, HelpCircle, FolderGit2 } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { InventoryItem } from '@/types';
import { normalizeBorder, normalizeBorderOpacity, cardShadow, buttonShadow } from '@/constants/pixelRatio';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;

export default function InventoryScreen() {
  const { items, yarnCount, hookCount } = useInventory();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'yarn' | 'hook' | 'other'>('all');

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const categories = [
    { id: 'all', label: t('inventory.all'), count: items.length, icon: <Grid3x3 size={18} color={selectedCategory === 'all' ? Colors.white : Colors.deepSage} />, color: Colors.deepSage },
    { id: 'yarn', label: t('inventory.yarn'), count: yarnCount, icon: <Volleyball size={18} color={selectedCategory === 'yarn' ? Colors.white : '#FFB84D'} />, color: '#FFB84D' },
    { id: 'hook', label: t('inventory.hooks'), count: hookCount, icon: <Wrench size={18} color={selectedCategory === 'hook' ? Colors.white : Colors.sage} />, color: Colors.sage },
    { id: 'other', label: t('inventory.other'), count: items.filter(i => i.category === 'other').length, icon: <Package size={18} color={selectedCategory === 'other' ? Colors.white : '#9C27B0'} />, color: '#9C27B0' },
  ];

  const renderItem = ({ item }: { item: InventoryItem }) => {
    // Get display name from root level
    const displayName = item.name || 'Untitled';

    return (
      <TouchableOpacity
        style={styles.itemWrapper}
        onPress={() => router.push(`/inventory/${item.id}`)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${displayName}${item.yarnDetails?.brand ? `, ${item.yarnDetails.brand}` : ''}`}
        accessibilityHint={`View ${displayName} details`}
      >
        <View style={styles.itemCard}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
          ) : (
            <View style={[styles.itemImage, styles.placeholderImage]}>
              {item.category === 'yarn' ? (
                <Volleyball size={32} color={Colors.warmGray} />
              ) : (
                <Package size={32} color={Colors.warmGray} />
              )}
            </View>
          )}
          <View style={styles.itemInfo}>
            <View>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {displayName}
              </Text>
              {item.yarnDetails?.brand && (
                <Text style={styles.itemBrand} numberOfLines={1}>
                  {item.yarnDetails.brand}
                </Text>
              )}
              {item.yarnDetails?.fiber && (
                <Text style={styles.itemComposition} numberOfLines={2}>
                  {item.yarnDetails.fiber}
                </Text>
              )}
              {item.yarnDetails?.colorName && (
                <Text style={styles.colorName} numberOfLines={1}>
                  {item.yarnDetails.colorName}
                </Text>
              )}
              {(item.yarnDetails?.ballWeightG != null && item.yarnDetails?.lengthM != null) && (
                <Text style={styles.itemSpecs}>
                  {item.yarnDetails.ballWeightG}g • {item.yarnDetails.lengthM}m
                </Text>
              )}
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.itemQuantity}>
                {t('inventory.qty')}: {item.quantity}
              </Text>
              {item.usedInProjects && item.usedInProjects.length > 0 && (
                <View style={styles.projectBadge}>
                  <FolderGit2 size={12} color={Colors.deepSage} />
                  <Text style={styles.projectBadgeText}>
                    {item.usedInProjects.length}
                  </Text>
                </View>
              )}
            </View>
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
              <HelpCircle size={isSmallDevice ? 24 : 28} color={Colors.deepSage} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
          nestedScrollEnabled={false}
          scrollEventThrottle={16}
        >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category.id as any)}
            activeOpacity={0.75}
            accessible={true}
            accessibilityRole="radio"
            accessibilityLabel={category.label}
            accessibilityHint={`Show ${category.label.toLowerCase()} items`}
            accessibilityState={{
              selected: selectedCategory === category.id,
              checked: selectedCategory === category.id,
            }}
          >
            <View style={styles.iconContainer}>
              {category.icon}
            </View>
            <Text style={[
              styles.categoryLabel,
              selectedCategory === category.id && styles.categoryLabelActive,
            ]}>
              {category.label}
            </Text>
            <Text style={[
              styles.categoryCount,
              selectedCategory === category.id && [styles.categoryCountActive, { borderColor: category.color }]
            ]}>
              {category.count}
            </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      <View style={styles.container}>
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Package size={64} color={Colors.warmGray} />}
          title={selectedCategory === 'all' ? t('inventory.noItems') : t('inventory.noItemsInCategory')}
          description={selectedCategory === 'all' ? t('inventory.addYourSupplies') : t('inventory.tryDifferentFilter')}
          action={
            selectedCategory === 'all' ? (
              <Button
                title={t('inventory.addFirstItem')}
                icon={<Plus size={20} color={Colors.white} />}
                onPress={() => router.push('/add-inventory')}
                size="large"
              />
            ) : undefined
          }
        />
      ) : (
        <FlatList
          key={selectedCategory}
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={styles.row}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}

        {items.length > 0 && (
          <TouchableOpacity
            style={styles.fab}
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
    backgroundColor: Colors.cream,
  },
  safeArea: {
    backgroundColor: Colors.cream,
  },
  customHeader: {
    backgroundColor: Colors.cream,
    paddingBottom: isSmallDevice ? 12 : 16,
    borderBottomWidth: normalizeBorder(1),
    borderBottomColor: Colors.border,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
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
    padding: isSmallDevice ? 6 : 8,
    backgroundColor: Colors.white,
    borderRadius: 24,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  filterWrapper: {
    backgroundColor: Colors.filterBar,
    marginTop: 0,
  },
  categoriesContainer: {
    maxHeight: 80,
    backgroundColor: 'transparent',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 154, 123, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 12,
    borderWidth: normalizeBorder(1),
    borderColor: `rgba(139, 154, 123, ${normalizeBorderOpacity(0.2)})`,
    gap: 8,
    minHeight: 44,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  categoryChipActive: {
    backgroundColor: Colors.linen,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.deepSage,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  categoryLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: -0.1,
  },
  categoryLabelActive: {
    color: Colors.charcoal,
    fontWeight: '600' as const,
  },
  categoryCount: {
    ...Typography.caption,
    color: Colors.deepSage,
    backgroundColor: 'rgba(139, 154, 123, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: '500' as const,
    minWidth: 28,
    textAlign: 'center',
    lineHeight: 18,
    borderWidth: normalizeBorder(0),
    height: 26,
    overflow: 'visible',
  },
  categoryCountActive: {
    backgroundColor: Colors.deepSage,
    color: Colors.white,
    fontWeight: '600' as const,
    borderWidth: normalizeBorder(0),
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    height: 26,
    overflow: 'visible',
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
    minHeight: 240,
    backgroundColor: Colors.linen,
    borderRadius: 16,
    borderWidth: normalizeBorder(0.5),
    borderColor: `rgba(139, 154, 123, ${normalizeBorderOpacity(0.12)})`,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  itemImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  placeholderImage: {
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    padding: 12,
  },
  itemTitle: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '500' as const,
    marginBottom: 6,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
    minHeight: 20,
  },
  itemBrand: {
    ...Typography.caption,
    color: Colors.sage,
    marginBottom: 4,
    fontWeight: '600' as const,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemComposition: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 16,
  },
  itemSpecs: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  colorName: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontStyle: 'italic',
    fontSize: 12,
    marginTop: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: normalizeBorder(1),
    borderTopColor: Colors.border,
  },
  itemQuantity: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontWeight: '500' as const,
    fontSize: 13,
    backgroundColor: 'rgba(139, 154, 123, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74, 93, 79, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  projectBadgeText: {
    ...Typography.caption,
    color: Colors.deepSage,
    fontWeight: '600' as const,
    fontSize: 12,
  },
  colorDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
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