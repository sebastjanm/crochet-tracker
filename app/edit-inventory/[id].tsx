import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { ImageGallery } from '@/components/ImageGallery';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { InventoryItem, YarnDetails, HookDetails } from '@/types';

export default function EditInventoryScreen() {
  const { id } = useLocalSearchParams();
  const { items, updateItem } = useInventory();
  const { t } = useLanguage();
  
  const item = items.find(i => i.id === id);

  const [category, setCategory] = useState<InventoryItem['category']>('other');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [minQuantity, setMinQuantity] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  // Yarn specific fields (matching add-inventory.tsx naming)
  const [yarnName, setYarnName] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [fiber, setFiber] = useState('');
  const [weightCategory, setWeightCategory] = useState('');
  const [ballWeight, setBallWeight] = useState('');
  const [length, setLength] = useState('');
  const [recommendedHookSize, setRecommendedHookSize] = useState('');
  const [storage, setStorage] = useState('');
  const [store, setStore] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  // Hook specific fields
  const [hookName, setHookName] = useState('');
  const [hookSize, setHookSize] = useState('');

  // Other specific fields
  const [otherName, setOtherName] = useState('');

  useEffect(() => {
    if (item) {
      setCategory(item.category);
      setDescription(item.description);
      setQuantity(item.quantity.toString());
      setMinQuantity(item.minQuantity?.toString() || '');
      setImages(item.images || []);
      setTags(item.tags?.join(', ') || '');
      setNotes(item.notes || '');

      if (item.yarnDetails) {
        setYarnName(item.yarnDetails.name || '');
        setBrand(item.yarnDetails.brand || '');
        setColor(item.yarnDetails.color || '');
        setColorCode(item.yarnDetails.color_code || '');
        setFiber(item.yarnDetails.fiber || '');
        setWeightCategory(item.yarnDetails.weight_category || '');
        setBallWeight(item.yarnDetails.ball_weight?.toString() || '');
        setLength(item.yarnDetails.length?.toString() || '');
        setRecommendedHookSize(item.yarnDetails.hook_size || '');
        setStorage(item.yarnDetails.storage || '');
        setStore(item.yarnDetails.store || '');
        if (item.yarnDetails.purchase_date) {
          const date = item.yarnDetails.purchase_date instanceof Date
            ? item.yarnDetails.purchase_date
            : new Date(item.yarnDetails.purchase_date);
          setPurchaseDate(date.toISOString().split('T')[0]);
        } else {
          setPurchaseDate('');
        }
        setPurchasePrice(item.yarnDetails.purchase_price?.toString() || '');
      }

      if (item.hookDetails) {
        setHookName(item.hookDetails.name || '');
        setHookSize(item.hookDetails.size || '');
      }

      if (item.otherDetails) {
        setOtherName(item.otherDetails.name || '');
      }
    }
  }, [item]);



  const handleSave = async () => {
    // Validate name based on category
    if (category === 'yarn' && !yarnName.trim()) {
      Alert.alert(t('common.error'), 'Please enter a yarn name');
      return;
    }
    if (category === 'hook' && !hookName.trim()) {
      Alert.alert(t('common.error'), 'Please enter a hook name');
      return;
    }
    if (category === 'other' && !otherName.trim()) {
      Alert.alert(t('common.error'), 'Please enter an item name');
      return;
    }

    if (!item) {
      Alert.alert(t('common.error'), 'Item not found');
      return;
    }

    const qty = parseInt(quantity) || 1;
    const ballWeightNum = ballWeight ? parseFloat(ballWeight) : undefined;
    const lengthNum = length ? parseFloat(length) : undefined;
    const priceNum = purchasePrice ? parseFloat(purchasePrice) : undefined;

    const yarnDetails: YarnDetails | undefined = category === 'yarn' ? {
      name: yarnName.trim(),
      brand: brand.trim() || undefined,
      color: color.trim() || undefined,
      color_code: colorCode.trim() || undefined,
      fiber: fiber.trim() || undefined,
      weight_category: weightCategory.trim() || undefined,
      ball_weight: ballWeightNum,
      length: lengthNum,
      hook_size: recommendedHookSize.trim() || undefined,
      storage: storage.trim() || undefined,
      store: store.trim() || undefined,
      purchase_date: purchaseDate ? new Date(purchaseDate) : undefined,
      purchase_price: priceNum,
      total_length: lengthNum ? lengthNum * qty : undefined,
      total_weight: ballWeightNum ? ballWeightNum * qty : undefined,
    } : undefined;

    const hookDetails: HookDetails | undefined = category === 'hook' ? {
      name: hookName.trim(),
      size: hookSize.trim() || undefined,
    } : undefined;

    const otherDetails = category === 'other' ? {
      name: otherName.trim(),
    } : undefined;

    const updatedItem: Partial<InventoryItem> = {
      category,
      description: description.trim(),
      quantity: qty,
      minQuantity: minQuantity ? parseInt(minQuantity) : undefined,
      images,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      yarnDetails,
      hookDetails,
      otherDetails,
      notes: notes.trim() || undefined,
    };

    await updateItem(item.id, updatedItem);
    router.dismiss();
  };


  if (!item) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Text style={styles.errorText}>Item not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalHeader title={t('inventory.editItem')} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.categorySection}>
            <Text style={styles.sectionLabel}>{t('inventory.category')}</Text>
            <View style={styles.categoryButtons}>
              {[
                { id: 'yarn', label: t('inventory.yarn') },
                { id: 'hook', label: t('inventory.hook') },
                { id: 'other', label: t('inventory.other') },
              ].map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat.id as InventoryItem['category'])}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityLabel={cat.label}
                  accessibilityHint={`Set item category to ${cat.label}`}
                  accessibilityState={{
                    selected: category === cat.id,
                    checked: category === cat.id,
                  }}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category === cat.id && styles.categoryButtonTextActive,
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('inventory.basicInfo')}</Text>

          {/* Name field - always first, category-specific */}
          {category === 'yarn' && (
            <Input
              label="Yarn Name"
              placeholder="e.g., Alize Angora Gold Batik"
              value={yarnName}
              onChangeText={setYarnName}
              required={true}
            />
          )}

          {category === 'hook' && (
            <Input
              label="Hook Name"
              placeholder="e.g., Clover Amour Hook"
              value={hookName}
              onChangeText={setHookName}
              required={true}
            />
          )}

          {category === 'other' && (
            <Input
              label="Item Name"
              placeholder="e.g., Stitch Markers Set"
              value={otherName}
              onChangeText={setOtherName}
              required={true}
            />
          )}

          {/* Description - always second */}
          <Input
            label={t('inventory.description')}
            placeholder={t('inventory.describeItem')}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            style={styles.textArea}
          />

          {/* Quantity - always third */}
          <Input
            label={t('inventory.quantity')}
            placeholder="1"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          {/* Category-specific details section */}
          {category === 'yarn' && (
            <>
              <Text style={styles.sectionTitle}>{t('inventory.yarnDetails')}</Text>

              <Input
                label="Brand"
                placeholder="e.g., Alize"
                value={brand}
                onChangeText={setBrand}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Color"
                    placeholder="e.g., 8057 Opečno-smetana"
                    value={color}
                    onChangeText={setColor}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label="Color Code"
                    placeholder="e.g., 8057"
                    value={colorCode}
                    onChangeText={setColorCode}
                  />
                </View>
              </View>

              <Input
                label="Fiber Content"
                placeholder="e.g., 80% akril / 20% volna"
                value={fiber}
                onChangeText={setFiber}
              />

              <Input
                label="Weight Category"
                placeholder="e.g., Fingering, DK, Worsted"
                value={weightCategory}
                onChangeText={setWeightCategory}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Ball Weight (g)"
                    placeholder="100"
                    value={ballWeight}
                    onChangeText={setBallWeight}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label="Length (m)"
                    placeholder="280"
                    value={length}
                    onChangeText={setLength}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Input
                label="Hook Size"
                placeholder="e.g., 3 - 3.5 mm"
                value={recommendedHookSize}
                onChangeText={setRecommendedHookSize}
              />

              <Input
                label="Storage Location"
                placeholder="e.g., Škatla 2 – tople barve"
                value={storage}
                onChangeText={setStorage}
              />

              <Input
                label="Store"
                placeholder="e.g., Svet Metraže"
                value={store}
                onChangeText={setStore}
              />

              <Input
                label="Purchase Date"
                placeholder="YYYY-MM-DD"
                value={purchaseDate}
                onChangeText={setPurchaseDate}
              />

              <Input
                label="Purchase Price"
                placeholder="0.00"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="decimal-pad"
              />
            </>
          )}

          {category === 'hook' && (
            <>
              <Text style={styles.sectionTitle}>{t('inventory.hookDetails')}</Text>

              <Input
                label={t('inventory.size')}
                placeholder="e.g., 5mm"
                value={hookSize}
                onChangeText={setHookSize}
              />
            </>
          )}

          <Input
            label={t('inventory.notes')}
            placeholder={t('inventory.additionalNotes')}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
            style={styles.textArea}
          />

          {/* Edit-specific fields */}
          <Input
            label={t('inventory.minQuantity')}
            placeholder={t('inventory.optional')}
            value={minQuantity}
            onChangeText={setMinQuantity}
            keyboardType="numeric"
          />

          <Input
            label={t('inventory.tags')}
            placeholder={t('inventory.tagsPlaceholder')}
            value={tags}
            onChangeText={setTags}
          />

          <View style={styles.imageSection}>
            <Text style={styles.sectionLabel}>{t('inventory.photos')}</Text>
            <ImageGallery
              images={images}
              onImagesChange={setImages}
              maxImages={10}
              editable={true}
            />
          </View>

          <View style={styles.footer}>
            <Button
              title={t('common.save')}
              onPress={handleSave}
              size="large"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 20,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    marginTop: 24,
    marginBottom: 12,
  },
  categorySection: {
    marginBottom: 16,
  },
  sectionLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.sage,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryButtonText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  categoryButtonTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  imageSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  footer: {
    marginTop: 24,
    gap: 12,
  },
});