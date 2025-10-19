import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Package, Volleyball, Wrench } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ModalHeader } from '@/components/ModalHeader';
import { ImageGallery } from '@/components/ImageGallery';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { InventoryItem } from '@/types';

export default function EditInventoryScreen() {
  const { id } = useLocalSearchParams();
  const { items, updateItem, deleteItem } = useInventory();
  const { t } = useLanguage();
  
  const item = items.find(i => i.id === id);

  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [minQuantity, setMinQuantity] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('other');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState('');

  // Yarn specific fields
  const [yarnName, setYarnName] = useState('');
  const [yarnBrand, setYarnBrand] = useState('');
  const [yarnWeight, setYarnWeight] = useState('');
  const [yarnLength, setYarnLength] = useState('');
  const [yarnColorName, setYarnColorName] = useState('');
  const [yarnColorHex, setYarnColorHex] = useState('');
  const [yarnDyeLot, setYarnDyeLot] = useState('');
  const [yarnFiber, setYarnFiber] = useState('');
  const [yarnPurchasePrice, setYarnPurchasePrice] = useState('');
  const [yarnPurchaseLocation, setYarnPurchaseLocation] = useState('');
  const [yarnNotes, setYarnNotes] = useState('');

  // Hook specific fields
  const [hookName, setHookName] = useState('');
  const [hookBrand, setHookBrand] = useState('');
  const [hookSize, setHookSize] = useState('');
  const [hookMaterial, setHookMaterial] = useState('');
  const [hookPurchasePrice, setHookPurchasePrice] = useState('');
  const [hookPurchaseLocation, setHookPurchaseLocation] = useState('');
  const [hookNotes, setHookNotes] = useState('');

  // Other specific fields
  const [otherName, setOtherName] = useState('');

  useEffect(() => {
    if (item) {
      setDescription(item.description);
      setQuantity(item.quantity.toString());
      setMinQuantity(item.minQuantity?.toString() || '');
      setCategory(item.category);
      setImages(item.images || []);
      setTags(item.tags?.join(', ') || '');

      if (item.yarnDetails) {
        setYarnName(item.yarnDetails.name || '');
        setYarnBrand(item.yarnDetails.brand || '');
        setYarnWeight(item.yarnDetails.ball_weight?.toString() || '');
        setYarnLength(item.yarnDetails.length?.toString() || '');
        setYarnColorName(item.yarnDetails.color || '');
        setYarnColorHex('');
        setYarnDyeLot('');
        setYarnFiber(item.yarnDetails.fiber || '');
        setYarnPurchasePrice(item.yarnDetails.purchase_price?.toString() || '');
        setYarnPurchaseLocation(item.yarnDetails.store || '');
        setYarnNotes('');
      }

      if (item.hookDetails) {
        setHookName(item.hookDetails.name || '');
        setHookBrand(item.hookDetails.brand || '');
        setHookSize(item.hookDetails.size || '');
        setHookMaterial(item.hookDetails.material || '');
        setHookPurchasePrice(item.hookDetails.purchasePrice?.toString() || '');
        setHookPurchaseLocation(item.hookDetails.purchaseLocation || '');
        setHookNotes('');
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

    const updatedItem: Partial<InventoryItem> = {
      description: description.trim(),
      quantity: parseInt(quantity) || 1,
      minQuantity: minQuantity ? parseInt(minQuantity) : undefined,
      category,
      images,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    if (category === 'yarn') {
      updatedItem.yarnDetails = {
        name: yarnName.trim(),
        brand: yarnBrand.trim(),
        ball_weight: yarnWeight ? parseFloat(yarnWeight) : undefined,
        length: yarnLength ? parseFloat(yarnLength) : undefined,
        color: yarnColorName.trim(),
        fiber: yarnFiber.trim(),
        store: yarnPurchaseLocation.trim(),
        purchase_price: yarnPurchasePrice ? parseFloat(yarnPurchasePrice) : undefined,
      };
    }

    if (category === 'hook') {
      updatedItem.hookDetails = {
        name: hookName.trim(),
        brand: hookBrand.trim(),
        size: hookSize.trim(),
        material: (hookMaterial.trim() || 'other') as 'aluminum' | 'steel' | 'plastic' | 'bamboo' | 'wood' | 'resin' | 'other',
        purchasePrice: hookPurchasePrice ? parseFloat(hookPurchasePrice) : undefined,
        purchaseLocation: hookPurchaseLocation.trim(),
      };
    }

    if (category === 'other') {
      updatedItem.otherDetails = {
        name: otherName.trim(),
      };
    }

    await updateItem(item.id, updatedItem);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      t('common.confirm'),
      t('inventory.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            if (item) {
              await deleteItem(item.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Item not found</Text>
      </SafeAreaView>
    );
  }

  // Get display name for accessibility
  const displayName = item.category === 'yarn'
    ? (item.yarnDetails?.name || 'this yarn')
    : item.category === 'hook'
    ? (item.hookDetails?.name || 'this hook')
    : (item.otherDetails?.name || 'this item');

  return (
    <SafeAreaView style={styles.container}>
      <ModalHeader title={t('inventory.editItem')} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('inventory.basicInfo')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('inventory.description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('inventory.descriptionPlaceholder')}
              placeholderTextColor={Colors.warmGray}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>{t('inventory.quantity')}</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={Colors.warmGray}
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>{t('inventory.minQuantity')}</Text>
              <TextInput
                style={styles.input}
                value={minQuantity}
                onChangeText={setMinQuantity}
                keyboardType="numeric"
                placeholder={t('inventory.optional')}
                placeholderTextColor={Colors.warmGray}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('inventory.category')}</Text>
            <View style={styles.categoryContainer}>
              {[
                { id: 'yarn', label: t('inventory.yarn'), icon: <Volleyball size={20} color={category === 'yarn' ? Colors.white : Colors.deepSage} /> },
                { id: 'hook', label: t('inventory.hooks'), icon: <Wrench size={20} color={category === 'hook' ? Colors.white : Colors.deepSage} /> },
                { id: 'other', label: t('inventory.other'), icon: <Package size={20} color={category === 'other' ? Colors.white : Colors.deepSage} /> },
              ].map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonActive
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
                  {cat.icon}
                  <Text style={[
                    styles.categoryButtonText,
                    category === cat.id && styles.categoryButtonTextActive
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('inventory.tags')}</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder={t('inventory.tagsPlaceholder')}
              placeholderTextColor={Colors.warmGray}
            />
          </View>
        </Card>

        {category === 'yarn' && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.yarnDetails')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Yarn Name *</Text>
              <TextInput
                style={styles.input}
                value={yarnName}
                onChangeText={setYarnName}
                placeholder="e.g., Alize Angora Gold Batik"
                placeholderTextColor={Colors.warmGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('inventory.brand')}</Text>
              <TextInput
                style={styles.input}
                value={yarnBrand}
                onChangeText={setYarnBrand}
                placeholder={t('inventory.brandPlaceholder')}
                placeholderTextColor={Colors.warmGray}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{t('inventory.weight')}</Text>
                <TextInput
                  style={styles.input}
                  value={yarnWeight}
                  onChangeText={setYarnWeight}
                  keyboardType="numeric"
                  placeholder="50g"
                  placeholderTextColor={Colors.warmGray}
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>{t('inventory.length')}</Text>
                <TextInput
                  style={styles.input}
                  value={yarnLength}
                  onChangeText={setYarnLength}
                  keyboardType="numeric"
                  placeholder="200m"
                  placeholderTextColor={Colors.warmGray}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('inventory.colorName')}</Text>
              <TextInput
                style={styles.input}
                value={yarnColorName}
                onChangeText={setYarnColorName}
                placeholder={t('inventory.colorNamePlaceholder')}
                placeholderTextColor={Colors.warmGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('inventory.fiber')}</Text>
              <TextInput
                style={styles.input}
                value={yarnFiber}
                onChangeText={setYarnFiber}
                placeholder={t('inventory.fiberPlaceholder')}
                placeholderTextColor={Colors.warmGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('inventory.dyeLot')}</Text>
              <TextInput
                style={styles.input}
                value={yarnDyeLot}
                onChangeText={setYarnDyeLot}
                placeholder={t('inventory.dyeLotPlaceholder')}
                placeholderTextColor={Colors.warmGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purchase Price</Text>
              <TextInput
                style={styles.input}
                value={yarnPurchasePrice}
                onChangeText={setYarnPurchasePrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.warmGray}
              />
            </View>
          </Card>
        )}

        {category === 'hook' && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.hookDetails')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hook Name *</Text>
              <TextInput
                style={styles.input}
                value={hookName}
                onChangeText={setHookName}
                placeholder="e.g., Clover Amour Hook"
                placeholderTextColor={Colors.warmGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('inventory.brand')}</Text>
              <TextInput
                style={styles.input}
                value={hookBrand}
                onChangeText={setHookBrand}
                placeholder={t('inventory.brandPlaceholder')}
                placeholderTextColor={Colors.warmGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('inventory.size')}</Text>
              <TextInput
                style={styles.input}
                value={hookSize}
                onChangeText={setHookSize}
                placeholder="3.5mm"
                placeholderTextColor={Colors.warmGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('inventory.material')}</Text>
              <TextInput
                style={styles.input}
                value={hookMaterial}
                onChangeText={setHookMaterial}
                placeholder={t('inventory.materialPlaceholder')}
                placeholderTextColor={Colors.warmGray}
              />
            </View>
          </Card>
        )}

        {category === 'other' && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Item Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                value={otherName}
                onChangeText={setOtherName}
                placeholder="e.g., Stitch Markers Set"
                placeholderTextColor={Colors.warmGray}
              />
            </View>
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('inventory.images')}</Text>
          <ImageGallery
            images={images}
            onImagesChange={setImages}
            maxImages={10}
            editable={true}
          />
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title={t('common.save')}
            onPress={handleSave}
            size="large"
            style={styles.saveButton}
          />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('common.delete')}
            accessibilityHint={`Delete ${displayName} from inventory permanently`}
          >
            <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 20,
  },
  section: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
    marginBottom: 16,
    fontWeight: '600' as const,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    ...Typography.caption,
    color: Colors.charcoal,
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.charcoal,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.deepSage,
  },
  categoryButtonText: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontWeight: '500' as const,
  },
  categoryButtonTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },

  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
  },
});