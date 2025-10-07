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
} from 'react-native';

import { router } from 'expo-router';
import { Plus, Package, Volleyball, Grid3x3, Wrench } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { InventoryItem } from '@/types';

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

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity
      style={styles.itemWrapper}
      onPress={() => router.push(`/edit-inventory/${item.id}`)}
      activeOpacity={0.7}
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
              {item.title}
            </Text>
            {item.yarnDetails?.brand && (
              <Text style={styles.itemBrand} numberOfLines={1}>
                {item.yarnDetails.brand}
              </Text>
            )}
            {item.yarnDetails?.composition && (
              <Text style={styles.itemComposition} numberOfLines={2}>
                {item.yarnDetails.composition}
              </Text>
            )}
            {item.yarnDetails?.colorName && (
              <Text style={styles.colorName} numberOfLines={1}>
                {item.yarnDetails.colorName}
              </Text>
            )}
            {item.yarnDetails?.weight && item.yarnDetails?.length && (
              <Text style={styles.itemSpecs}>
                {item.yarnDetails.weight}g • {item.yarnDetails.length}m
              </Text>
            )}
          </View>
          <View style={styles.itemMeta}>
            <Text style={styles.itemQuantity}>
              {t('inventory.qty')}: {item.quantity}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && [styles.categoryChipActive, { backgroundColor: category.color }]
            ]}
            onPress={() => setSelectedCategory(category.id as any)}
            activeOpacity={0.75}
          >
            {category.icon}
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

      {filteredItems.length === 0 ? (
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
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      )}

      {items.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/add-inventory')}
          activeOpacity={0.8}
        >
          <Plus size={32} color={Colors.white} strokeWidth={3} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  categoriesContainer: {
    maxHeight: 80,
    backgroundColor: Colors.beige,
    marginTop: 12,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 26,
    marginRight: 12,
    borderWidth: 2.5,
    borderColor: Colors.sage,
    gap: 10,
    minHeight: 50,
    ...Platform.select({
      ios: {
        shadowColor: Colors.sage,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  categoryChipActive: {
    borderColor: Colors.deepSage,
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: Colors.sage,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        transform: [{ scale: 1.03 }],
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  categoryLabel: {
    ...Typography.body,
    color: Colors.deepSage,
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: -0.1,
  },
  categoryLabelActive: {
    color: Colors.white,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  categoryCount: {
    ...Typography.caption,
    color: Colors.white,
    backgroundColor: Colors.deepSage,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    fontSize: 14,
    fontWeight: '700' as const,
    minWidth: 28,
    textAlign: 'center',
    lineHeight: 20,
    borderWidth: 1,
    borderColor: Colors.sage,
  },
  categoryCountActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: Colors.deepSage,
    fontWeight: '800' as const,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  list: {
    padding: 8,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    gap: 8,
  },
  itemWrapper: {
    flex: 1,
    maxWidth: '49%',
  },
  itemCard: {
    width: '100%',
    minHeight: 240,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  itemImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
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
    fontWeight: '600' as const,
    marginBottom: 6,
    fontSize: 15,
    lineHeight: 20,
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
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  itemQuantity: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 13,
    backgroundColor: Colors.beige,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.select({ ios: 100, android: 90, default: 100 }),
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.sage,
    borderWidth: 3,
    borderColor: Colors.deepSage,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.sage,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
});