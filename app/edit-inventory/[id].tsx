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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { ImageGallery } from '@/components/ImageGallery';
import { useInventory } from '@/hooks/inventory-context';
import { useProjects } from '@/hooks/projects-context';
import { useAuth } from '@/hooks/auth-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, cardShadow, buttonShadow, getPixelRatio } from '@/constants/pixelRatio';
import { InventoryItem, YarnDetails, HookDetails } from '@/types';

// DEBUG: Log pixel ratio on load
console.log('🔍 DEBUG [edit-inventory]: Device pixel ratio =', getPixelRatio());

export default function EditInventoryScreen() {
  const { id } = useLocalSearchParams();
  const { items, updateItem } = useInventory();
  const { projects } = useProjects();
  const { user } = useAuth();
  const { t } = useLanguage();

  const item = items.find(i => i.id === id);

  const [category, setCategory] = useState<InventoryItem['category']>('other');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Yarn specific fields
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
  const [yarnLine, setYarnLine] = useState('');
  const [yarnNeedleSizeMm, setYarnNeedleSizeMm] = useState('');
  const [colorFamily, setColorFamily] = useState('');

  // Hook specific fields
  const [hookName, setHookName] = useState('');
  const [hookSize, setHookSize] = useState('');
  const [hookBrand, setHookBrand] = useState('');
  const [hookModel, setHookModel] = useState('');
  const [hookSizeMm, setHookSizeMm] = useState('');
  const [hookHandleType, setHookHandleType] = useState('');
  const [hookMaterial, setHookMaterial] = useState('');
  const [hookStore, setHookStore] = useState('');
  const [hookPurchaseDate, setHookPurchaseDate] = useState('');
  const [hookPurchasePrice, setHookPurchasePrice] = useState('');

  // Other specific fields
  const [otherName, setOtherName] = useState('');
  const [otherType, setOtherType] = useState('');
  const [otherBrand, setOtherBrand] = useState('');
  const [otherModel, setOtherModel] = useState('');
  const [otherMaterial, setOtherMaterial] = useState('');
  const [otherStore, setOtherStore] = useState('');
  const [otherPurchaseDate, setOtherPurchaseDate] = useState('');
  const [otherPurchasePrice, setOtherPurchasePrice] = useState('');

  // Root level fields (apply to all categories)
  const [unit, setUnit] = useState<'piece' | 'skein' | 'ball' | 'meter' | 'gram' | 'set'>('skein');
  const [usedInProjects, setUsedInProjects] = useState<string[]>([]);

  // Helper function to format Date to EU format (DD.MM.YYYY)
  const formatEUDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  useEffect(() => {
    if (item) {
      setCategory(item.category);
      setDescription(item.description);
      setQuantity(item.quantity.toString());
      setImages(item.images || []);
      setNotes(item.notes || '');

      // Root level fields
      setUnit(item.unit || 'skein');
      setUsedInProjects(item.usedInProjects || []);

      // Set name from root level based on category
      if (item.category === 'yarn') {
        setYarnName(item.name || '');
      } else if (item.category === 'hook') {
        setHookName(item.name || '');
      } else if (item.category === 'other') {
        setOtherName(item.name || '');
      }

      if (item.yarnDetails) {
        setBrand(item.yarnDetails.brand || '');
        setYarnLine(item.yarnDetails.line || '');
        setColor(item.yarnDetails.colorName || '');
        setColorCode(item.yarnDetails.colorCode || '');
        setColorFamily(item.yarnDetails.colorFamily || '');
        setFiber(item.yarnDetails.fiber || '');
        setWeightCategory(item.yarnDetails.weightCategory || '');
        setBallWeight(item.yarnDetails.ballWeightG?.toString() || '');
        setLength(item.yarnDetails.lengthM?.toString() || '');
        setRecommendedHookSize(item.yarnDetails.hookSizeMm || '');
        setYarnNeedleSizeMm(item.yarnDetails.needleSizeMm || '');
        setStorage(item.yarnDetails.storageLocation || '');
        setStore(item.yarnDetails.store || '');
        if (item.yarnDetails.purchaseDate) {
          const date = item.yarnDetails.purchaseDate instanceof Date
            ? item.yarnDetails.purchaseDate
            : new Date(item.yarnDetails.purchaseDate);
          setPurchaseDate(formatEUDate(date));
        } else {
          setPurchaseDate('');
        }
        setPurchasePrice(item.yarnDetails.purchasePrice?.toString() || '');
      }

      if (item.hookDetails) {
        setHookSize(item.hookDetails.size || '');
        setHookBrand(item.hookDetails.brand || '');
        setHookModel(item.hookDetails.model || '');
        setHookSizeMm(item.hookDetails.sizeMm?.toString() || '');
        setHookHandleType(item.hookDetails.handleType || '');
        setHookMaterial(item.hookDetails.material || '');
        setHookStore(item.hookDetails.store || '');
        if (item.hookDetails.purchaseDate) {
          const date = item.hookDetails.purchaseDate instanceof Date
            ? item.hookDetails.purchaseDate
            : new Date(item.hookDetails.purchaseDate);
          setHookPurchaseDate(formatEUDate(date));
        } else {
          setHookPurchaseDate('');
        }
        setHookPurchasePrice(item.hookDetails.purchasePrice?.toString() || '');
        setStorage(item.hookDetails.storageLocation || '');
      }

      if (item.otherDetails) {
        setOtherType(item.otherDetails.type || '');
        setOtherBrand(item.otherDetails.brand || '');
        setOtherModel(item.otherDetails.model || '');
        setOtherMaterial(item.otherDetails.material || '');
        setOtherStore(item.otherDetails.store || '');
        if (item.otherDetails.purchaseDate) {
          const date = item.otherDetails.purchaseDate instanceof Date
            ? item.otherDetails.purchaseDate
            : new Date(item.otherDetails.purchaseDate);
          setOtherPurchaseDate(formatEUDate(date));
        } else {
          setOtherPurchaseDate('');
        }
        setOtherPurchasePrice(item.otherDetails.purchasePrice?.toString() || '');
        setStorage(item.otherDetails.storageLocation || '');
      }
    }
  }, [item]);

  // Auto-set unit based on category
  useEffect(() => {
    if (category === 'yarn') {
      setUnit('skein');
    } else {
      setUnit('piece');
    }
  }, [category]);

  // Helper function to parse EU date format (DD.MM.YYYY) to Date
  const parseEUDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;

    // Try parsing DD.MM.YYYY format
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }

    return undefined;
  };

  const handleSave = async () => {
    // Validate name based on category
    if (category === 'yarn' && !yarnName.trim()) {
      Alert.alert(t('common.error'), t('inventory.pleaseEnterYarnName'));
      return;
    }
    if (category === 'hook' && !hookName.trim()) {
      Alert.alert(t('common.error'), t('inventory.pleaseEnterHookName'));
      return;
    }
    if (category === 'other' && !otherName.trim()) {
      Alert.alert(t('common.error'), t('inventory.pleaseEnterItemName'));
      return;
    }

    if (!item) {
      Alert.alert(t('common.error'), t('inventory.itemNotFound'));
      return;
    }

    const qty = parseInt(quantity) || 1;
    const ballWeightNum = ballWeight ? parseFloat(ballWeight) : undefined;
    const lengthNum = length ? parseFloat(length) : undefined;
    const priceNum = purchasePrice ? parseFloat(purchasePrice) : undefined;

    const yarnDetails: YarnDetails | undefined = category === 'yarn' ? {
      brand: brand.trim() || undefined,
      line: yarnLine.trim() || undefined,
      colorName: color.trim() || undefined,
      colorCode: colorCode.trim() || undefined,
      colorFamily: colorFamily.trim() || undefined,
      fiber: fiber.trim() || '',
      weightCategory: weightCategory.trim() || '',
      ballWeightG: ballWeightNum || 0,
      lengthM: lengthNum || 0,
      hookSizeMm: recommendedHookSize.trim() || undefined,
      needleSizeMm: yarnNeedleSizeMm.trim() || undefined,
      storageLocation: storage.trim() || undefined,
      store: store.trim() || undefined,
      purchaseDate: parseEUDate(purchaseDate),
      purchasePrice: priceNum,
      currency: user?.currency || 'EUR',
    } : undefined;

    const hookPriceNum = hookPurchasePrice ? parseFloat(hookPurchasePrice) : undefined;

    const hookDetails: HookDetails | undefined = category === 'hook' ? {
      brand: hookBrand.trim() || undefined,
      model: hookModel.trim() || undefined,
      sizeMm: hookSizeMm ? parseFloat(hookSizeMm) : undefined,
      handleType: (hookHandleType.trim() || undefined) as 'ergonomic' | 'inline' | 'tapered' | 'standard' | undefined,
      material: (hookMaterial.trim() || undefined) as 'aluminum' | 'steel' | 'plastic' | 'bamboo' | 'wood' | 'resin' | 'carbonFiber' | 'other' | undefined,
      storageLocation: storage.trim() || undefined,
      store: hookStore.trim() || undefined,
      purchaseDate: parseEUDate(hookPurchaseDate),
      purchasePrice: hookPriceNum,
      currency: user?.currency || 'EUR',
      // Keep legacy size field for backwards compatibility
      size: hookSize.trim() || hookSizeMm.trim() || undefined,
    } : undefined;

    const otherPriceNum = otherPurchasePrice ? parseFloat(otherPurchasePrice) : undefined;

    const otherDetails = category === 'other' ? {
      type: (otherType.trim() || undefined) as 'stitchMarker' | 'scissors' | 'needle' | 'tapestryNeedle' | 'yarnNeedle' | 'gauge' | 'rowCounter' | 'storage' | 'measuringTape' | 'stitchHolder' | 'patternBook' | 'organizer' | 'blockingPins' | 'pompomMaker' | 'other' | undefined,
      brand: otherBrand.trim() || undefined,
      model: otherModel.trim() || undefined,
      material: otherMaterial.trim() || undefined,
      storageLocation: storage.trim() || undefined,
      store: otherStore.trim() || undefined,
      purchaseDate: parseEUDate(otherPurchaseDate),
      purchasePrice: otherPriceNum,
      currency: user?.currency || 'EUR',
    } : undefined;

    // Get name based on category
    const itemName = category === 'yarn'
      ? yarnName.trim()
      : category === 'hook'
      ? hookName.trim()
      : otherName.trim();

    const updatedItem: Partial<InventoryItem> = {
      name: itemName,
      category,
      description: description.trim(),
      quantity: qty,
      unit,
      usedInProjects: usedInProjects.length > 0 ? usedInProjects : undefined,
      images,
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
          <View style={styles.imageSection}>
            <Text style={styles.sectionLabel}>{t('inventory.photos')}</Text>
            <ImageGallery
              images={images}
              onImagesChange={setImages}
              maxImages={10}
              editable={true}
            />
          </View>

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
              label={t('inventory.yarnName')}
              placeholder={t('inventory.yarnNamePlaceholder')}
              value={yarnName}
              onChangeText={setYarnName}
              required={true}
            />
          )}

          {category === 'hook' && (
            <Input
              label={t('inventory.hookName')}
              placeholder={t('inventory.hookNamePlaceholder')}
              value={hookName}
              onChangeText={setHookName}
              required={true}
            />
          )}

          {category === 'other' && (
            <Input
              label={t('inventory.itemName')}
              placeholder={t('inventory.itemNamePlaceholder')}
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
            label={category === 'yarn' ? t('inventory.quantitySkeins') : t('inventory.quantityPieces')}
            placeholder="1"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          {/* Root level fields - apply to all categories */}
          <Text style={styles.sectionTitle}>{t('inventory.additionalInfo')}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.sectionLabel}>{t('inventory.usedInProjects')}</Text>
            <Text style={styles.sectionHint}>{t('inventory.usedInProjectsHint')}</Text>
            {projects.length > 0 ? (
              <View style={styles.projectButtons}>
                {projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.projectButton,
                      usedInProjects.includes(project.id) && styles.projectButtonActive,
                    ]}
                    onPress={() => {
                      if (usedInProjects.includes(project.id)) {
                        setUsedInProjects(usedInProjects.filter(id => id !== project.id));
                      } else {
                        setUsedInProjects([...usedInProjects, project.id]);
                      }
                    }}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="checkbox"
                    accessibilityLabel={project.title}
                    accessibilityState={{
                      selected: usedInProjects.includes(project.id),
                      checked: usedInProjects.includes(project.id),
                    }}
                  >
                    <Text style={[
                      styles.projectButtonText,
                      usedInProjects.includes(project.id) && styles.projectButtonTextActive,
                    ]}>
                      {project.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noProjectsText}>{t('inventory.noProjectsYet')}</Text>
            )}
          </View>

          {/* Category-specific details section */}
          {category === 'yarn' && (
            <>
              <Text style={styles.sectionTitle}>{t('inventory.yarnDetails')}</Text>

              <Input
                label={t('inventory.brand')}
                placeholder={t('inventory.brandPlaceholder')}
                value={brand}
                onChangeText={setBrand}
              />

              <Input
                label={t('inventory.productLine')}
                placeholder={t('inventory.productLinePlaceholder')}
                value={yarnLine}
                onChangeText={setYarnLine}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label={t('inventory.color')}
                    placeholder={t('inventory.colorNamePlaceholder')}
                    value={color}
                    onChangeText={setColor}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label={t('inventory.colorCode')}
                    placeholder={t('inventory.colorCodePlaceholder')}
                    value={colorCode}
                    onChangeText={setColorCode}
                  />
                </View>
              </View>

              <Input
                label={t('inventory.colorFamily')}
                placeholder={t('inventory.colorFamilyPlaceholder')}
                value={colorFamily}
                onChangeText={setColorFamily}
              />

              <Input
                label={t('inventory.fiberContent')}
                placeholder={t('inventory.fiberPlaceholder')}
                value={fiber}
                onChangeText={setFiber}
              />

              <Input
                label={t('inventory.weightCategory')}
                placeholder={t('inventory.weightCategoryPlaceholder')}
                value={weightCategory}
                onChangeText={setWeightCategory}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label={t('inventory.ballWeightG')}
                    placeholder="100"
                    value={ballWeight}
                    onChangeText={setBallWeight}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label={t('inventory.lengthMPerBall')}
                    placeholder="280"
                    value={length}
                    onChangeText={setLength}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Input
                label={t('inventory.crochetHookSize')}
                placeholder="5.0"
                value={recommendedHookSize}
                onChangeText={setRecommendedHookSize}
              />

              <Input
                label={t('inventory.needleSizeMm')}
                placeholder="5.0"
                value={yarnNeedleSizeMm}
                onChangeText={setYarnNeedleSizeMm}
              />

              <Text style={styles.sectionTitle}>{t('inventory.purchaseInfo')}</Text>

              <Input
                label={t('inventory.store')}
                placeholder="e.g., Svet Metraže"
                value={store}
                onChangeText={setStore}
              />

              <Input
                label={t('inventory.purchaseDate')}
                placeholder="DD.MM.YYYY"
                value={purchaseDate}
                onChangeText={setPurchaseDate}
              />

              <Input
                label={t('inventory.price')}
                placeholder="0.00"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="decimal-pad"
              />

              <Text style={styles.sectionTitle}>{t('inventory.storageSection')}</Text>

              <Input
                label={t('inventory.storageLocation')}
                placeholder="e.g., Škatla 2 – tople barve"
                value={storage}
                onChangeText={setStorage}
              />
            </>
          )}

          {category === 'hook' && (
            <>
              <Text style={styles.sectionTitle}>{t('inventory.hookDetails')}</Text>

              <Input
                label={t('inventory.brand')}
                placeholder={t('inventory.hookBrandPlaceholder')}
                value={hookBrand}
                onChangeText={setHookBrand}
              />

              <Input
                label={t('inventory.model')}
                placeholder={t('inventory.modelPlaceholder')}
                value={hookModel}
                onChangeText={setHookModel}
              />

              <Input
                label={t('inventory.sizeMm')}
                placeholder="5.0"
                value={hookSizeMm}
                onChangeText={setHookSizeMm}
                keyboardType="decimal-pad"
              />

              <View style={styles.fieldGroup}>
                <Text style={styles.sectionLabel}>{t('inventory.handleType')}</Text>
                <View style={styles.handleTypeButtons}>
                  {['ergonomic', 'standard', 'inline', 'tapered'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.handleTypeButton,
                        hookHandleType === type && styles.handleTypeButtonActive,
                      ]}
                      onPress={() => setHookHandleType(type)}
                      activeOpacity={0.7}
                      accessible={true}
                      accessibilityRole="radio"
                      accessibilityLabel={t(`inventory.handleType_${type}`)}
                      accessibilityState={{
                        selected: hookHandleType === type,
                        checked: hookHandleType === type,
                      }}
                    >
                      <Text style={[
                        styles.handleTypeButtonText,
                        hookHandleType === type && styles.handleTypeButtonTextActive,
                      ]}>
                        {t(`inventory.handleType_${type}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Input
                label={t('inventory.material')}
                placeholder={t('inventory.materialPlaceholder')}
                value={hookMaterial}
                onChangeText={setHookMaterial}
              />

              <Text style={styles.sectionTitle}>{t('inventory.purchaseInfo')}</Text>

              <Input
                label={t('inventory.store')}
                placeholder="e.g., Local craft store"
                value={hookStore}
                onChangeText={setHookStore}
              />

              <Input
                label={t('inventory.purchaseDate')}
                placeholder="DD.MM.YYYY"
                value={hookPurchaseDate}
                onChangeText={setHookPurchaseDate}
              />

              <Input
                label={t('inventory.price')}
                placeholder="0.00"
                value={hookPurchasePrice}
                onChangeText={setHookPurchasePrice}
                keyboardType="decimal-pad"
              />

              <Text style={styles.sectionTitle}>{t('inventory.storageSection')}</Text>

              <Input
                label={t('inventory.storageLocation')}
                placeholder="e.g., Drawer 3"
                value={storage}
                onChangeText={setStorage}
              />
            </>
          )}

          {category === 'other' && (
            <>
              <Text style={styles.sectionTitle}>{t('inventory.itemDetails')}</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.sectionLabel}>{t('inventory.type')}</Text>
                <View style={styles.typeButtons}>
                  {[
                    'stitchMarker',
                    'scissors',
                    'needle',
                    'tapestryNeedle',
                    'yarnNeedle',
                    'gauge',
                    'rowCounter',
                    'measuringTape',
                    'stitchHolder',
                    'patternBook',
                    'organizer',
                    'blockingPins',
                    'pompomMaker',
                    'storage',
                    'other',
                  ].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        otherType === type && styles.typeButtonActive,
                      ]}
                      onPress={() => setOtherType(type)}
                      activeOpacity={0.7}
                      accessible={true}
                      accessibilityRole="radio"
                      accessibilityLabel={t(`inventory.type_${type}`)}
                      accessibilityState={{
                        selected: otherType === type,
                        checked: otherType === type,
                      }}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        otherType === type && styles.typeButtonTextActive,
                      ]}>
                        {t(`inventory.type_${type}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Input
                label={t('inventory.brand')}
                placeholder={t('inventory.brandPlaceholder')}
                value={otherBrand}
                onChangeText={setOtherBrand}
              />

              <Input
                label={t('inventory.model')}
                placeholder={t('inventory.modelPlaceholder')}
                value={otherModel}
                onChangeText={setOtherModel}
              />

              <Input
                label={t('inventory.material')}
                placeholder={t('inventory.materialPlaceholder')}
                value={otherMaterial}
                onChangeText={setOtherMaterial}
              />

              <Text style={styles.sectionTitle}>{t('inventory.purchaseInfo')}</Text>

              <Input
                label={t('inventory.store')}
                placeholder="e.g., Local craft store"
                value={otherStore}
                onChangeText={setOtherStore}
              />

              <Input
                label={t('inventory.purchaseDate')}
                placeholder="DD.MM.YYYY"
                value={otherPurchaseDate}
                onChangeText={setOtherPurchaseDate}
              />

              <Input
                label={t('inventory.price')}
                placeholder="0.00"
                value={otherPurchasePrice}
                onChangeText={setOtherPurchasePrice}
                keyboardType="decimal-pad"
              />

              <Text style={styles.sectionTitle}>{t('inventory.storageSection')}</Text>

              <Input
                label={t('inventory.storageLocation')}
                placeholder="e.g., Craft box"
                value={storage}
                onChangeText={setStorage}
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
  sectionHint: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginBottom: 12,
    fontSize: 13,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
    minHeight: 48,
    justifyContent: 'center',
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  categoryButtonActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.deepSage,
    borderWidth: normalizeBorder(2),
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  categoryButtonText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 14,
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
  fieldGroup: {
    marginBottom: 16,
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    marginBottom: 16,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  switchHint: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 12,
  },
  projectButtons: {
    gap: 8,
  },
  projectButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 48,
    justifyContent: 'center',
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  projectButtonActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.deepSage,
    borderWidth: normalizeBorder(2),
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  projectButtonText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  projectButtonTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  handleTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  handleTypeButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  handleTypeButtonActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.deepSage,
    borderWidth: normalizeBorder(2),
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  handleTypeButtonText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  handleTypeButtonTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  typeButtonActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.deepSage,
    borderWidth: normalizeBorder(2),
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  typeButtonText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  noProjectsText: {
    ...Typography.body,
    color: Colors.warmGray,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});