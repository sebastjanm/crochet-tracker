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
import { SectionHeader } from '@/components/SectionHeader';
import { Select } from '@/components/Select';
import { DatePicker } from '@/components/DatePicker';
import { ProjectSelectorModal } from '@/components/ProjectSelectorModal';
import { Minus, Plus } from 'lucide-react-native';
import { ProjectLinksSummary } from '@/components/ProjectLinksSummary';
import { useInventory } from '@/hooks/inventory-context';
import { useProjects } from '@/hooks/projects-context';
import { useAuth } from '@/hooks/auth-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, cardShadow, buttonShadow, getPixelRatio } from '@/constants/pixelRatio';
import { InventoryItem, YarnDetails, HookDetails, YarnWeightName, ProjectImage } from '@/types';

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
  const [images, setImages] = useState<ProjectImage[]>([]);
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
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
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
  const [hookPurchaseDate, setHookPurchaseDate] = useState<Date | undefined>(undefined);
  const [hookPurchasePrice, setHookPurchasePrice] = useState('');

  // Other specific fields
  const [otherName, setOtherName] = useState('');
  const [otherType, setOtherType] = useState('');
  const [otherBrand, setOtherBrand] = useState('');
  const [otherModel, setOtherModel] = useState('');
  const [otherMaterial, setOtherMaterial] = useState('');
  const [otherStore, setOtherStore] = useState('');
  const [otherPurchaseDate, setOtherPurchaseDate] = useState<Date | undefined>(undefined);
  const [otherPurchasePrice, setOtherPurchasePrice] = useState('');

  // Root level fields (apply to all categories)
  const [unit, setUnit] = useState<'piece' | 'skein' | 'ball' | 'meter' | 'gram' | 'set'>('skein');
  const [usedInProjects, setUsedInProjects] = useState<string[]>([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  useEffect(() => {
    if (item) {
      setCategory(item.category);
      setDescription(item.description || '');
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
        setBrand(item.yarnDetails.brand?.name || '');
        setYarnLine(item.yarnDetails.line || '');
        setColor(item.yarnDetails.colorName || '');
        setColorCode(item.yarnDetails.colorCode || '');
        setColorFamily(item.yarnDetails.colorFamily || '');
        // Convert fibers array to string
        const fiberStr = item.yarnDetails.fibers?.map(f => `${f.percentage}% ${f.fiberType}`).join(', ') || '';
        setFiber(fiberStr);
        setWeightCategory(item.yarnDetails.weight?.name || '');
        setBallWeight(item.yarnDetails.grams?.toString() || '');
        setLength(item.yarnDetails.meters?.toString() || '');
        // Convert hook size min/max to range string
        const hookMin = item.yarnDetails.hookSizeMin;
        const hookMax = item.yarnDetails.hookSizeMax;
        if (hookMin !== undefined && hookMax !== undefined) {
          setRecommendedHookSize(hookMin === hookMax ? `${hookMin}` : `${hookMin}-${hookMax}`);
        } else {
          setRecommendedHookSize('');
        }
        // Convert needle size min/max to range string
        const needleMin = item.yarnDetails.needleSizeMin;
        const needleMax = item.yarnDetails.needleSizeMax;
        if (needleMin !== undefined && needleMax !== undefined) {
          setYarnNeedleSizeMm(needleMin === needleMax ? `${needleMin}` : `${needleMin}-${needleMax}`);
        } else {
          setYarnNeedleSizeMm('');
        }
        setStorage(item.yarnDetails.storageLocation || '');
        setStore(item.yarnDetails.store || '');
        if (item.yarnDetails.purchaseDate) {
          const date = item.yarnDetails.purchaseDate instanceof Date
            ? item.yarnDetails.purchaseDate
            : new Date(item.yarnDetails.purchaseDate);
          setPurchaseDate(date);
        } else {
          setPurchaseDate(undefined);
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
          setHookPurchaseDate(date);
        } else {
          setHookPurchaseDate(undefined);
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
          setOtherPurchaseDate(date);
        } else {
          setOtherPurchaseDate(undefined);
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

    // Parse fiber string into array (e.g., "80% Acrylic, 20% Wool")
    const parseFibers = (fiberStr: string) => {
      if (!fiberStr.trim()) return [];
      return fiberStr.split(',').map(part => {
        const match = part.trim().match(/^(\d+)%?\s*(.+)$/);
        if (match) {
          return { fiberType: match[2].trim(), percentage: parseInt(match[1]) };
        }
        return { fiberType: part.trim(), percentage: 100 };
      });
    };

    // Parse hook size range (e.g., "2-4" or "3.5")
    const parseHookSize = (sizeStr: string) => {
      if (!sizeStr.trim()) return { min: undefined, max: undefined };
      const parts = sizeStr.split('-').map(s => parseFloat(s.trim()));
      if (parts.length === 2) {
        return { min: parts[0], max: parts[1] };
      }
      return { min: parts[0], max: parts[0] };
    };

    const hookSizes = parseHookSize(recommendedHookSize);
    const needleSizes = parseHookSize(yarnNeedleSizeMm);

    const yarnDetails: YarnDetails | undefined = category === 'yarn' ? {
      brand: { name: brand.trim() || '' },
      line: yarnLine.trim() || undefined,
      colorName: color.trim() || undefined,
      colorCode: colorCode.trim() || undefined,
      colorFamily: colorFamily.trim() || undefined,
      fibers: parseFibers(fiber),
      weight: { name: (weightCategory.trim() || 'DK') as YarnWeightName },
      grams: ballWeightNum || 0,
      meters: lengthNum || 0,
      hookSizeMin: hookSizes.min,
      hookSizeMax: hookSizes.max,
      needleSizeMin: needleSizes.min,
      needleSizeMax: needleSizes.max,
      storageLocation: storage.trim() || undefined,
      store: store.trim() || undefined,
      purchaseDate,
      purchasePrice: priceNum,
      currency: user?.currency || 'EUR',
    } : undefined;

    const hookPriceNum = hookPurchasePrice ? parseFloat(hookPurchasePrice) : undefined;

    const hookDetails: HookDetails | undefined = category === 'hook' ? {
      brand: hookBrand.trim() || undefined,
      model: hookModel.trim() || undefined,
      sizeMm: hookSizeMm ? parseFloat(hookSizeMm) : undefined,
      handleType: (hookHandleType.trim() || undefined) as 'standard' | 'ergonomic' | 'tunisian' | 'steel' | 'inline' | 'tapered' | undefined,
      material: (hookMaterial.trim() || undefined) as 'steel' | 'aluminum' | 'bamboo' | 'wood' | 'plastic' | 'nickel' | 'brass' | 'resin' | 'carbonFiber' | 'other' | undefined,
      storageLocation: storage.trim() || undefined,
      store: hookStore.trim() || undefined,
      purchaseDate: hookPurchaseDate,
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
      purchaseDate: otherPurchaseDate,
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
      <ModalHeader
        title={t('inventory.editItem')}
        showHelp={true}
        helpSection="inventory"
      />

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

          <SectionHeader title={t('inventory.basicInfo')} />

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
          />

          {/* Quantity - always third */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>
              {category === 'yarn' ? t('inventory.quantitySkeins') : t('inventory.quantityPieces')}
            </Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  parseInt(quantity) <= 1 && styles.quantityButtonDisabled,
                ]}
                onPress={() => {
                  const current = parseInt(quantity) || 1;
                  if (current > 1) setQuantity((current - 1).toString());
                }}
                disabled={parseInt(quantity) <= 1}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('common.decrease')}
              >
                <Minus size={20} color={parseInt(quantity) <= 1 ? Colors.warmGray : Colors.white} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity || '1'}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const current = parseInt(quantity) || 1;
                  setQuantity((current + 1).toString());
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('common.increase')}
              >
                <Plus size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Root level fields - apply to all categories */}
          <SectionHeader title={t('inventory.additionalInfo')} />

          <View style={styles.fieldGroup}>
            <Text style={styles.sectionLabel}>{t('inventory.usedInProjects')}</Text>

            <ProjectLinksSummary
              selectedProjectIds={usedInProjects}
              onPress={() => setShowProjectSelector(true)}
            />

            <ProjectSelectorModal
              visible={showProjectSelector}
              onClose={() => setShowProjectSelector(false)}
              selectedProjectIds={usedInProjects}
              onSelectionChange={setUsedInProjects}
            />
          </View>

          {/* Category-specific details section */}
          {category === 'yarn' && (
            <>
              <SectionHeader title={t('inventory.yarnDetails')} />

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

              <SectionHeader title={t('inventory.purchaseInfo')} />

              <Input
                label={t('inventory.store')}
                placeholder="e.g., Svet Metraže"
                value={store}
                onChangeText={setStore}
              />

              <DatePicker
                label={t('inventory.purchaseDate')}
                value={purchaseDate}
                onChange={setPurchaseDate}
                placeholder={t('inventory.selectPurchaseDate')}
                maxDate={new Date()}
              />

              <Input
                label={t('inventory.price')}
                placeholder="0.00"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="decimal-pad"
              />

              <SectionHeader title={t('inventory.storageSection')} />

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
              <SectionHeader title={t('inventory.hookDetails')} />

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

              <Select
                label={t('inventory.sizeMm')}
                value={hookSizeMm}
                onChange={setHookSizeMm}
                placeholder={t('inventory.selectHookSize')}
                options={[
                  { value: '1', label: '1 mm' },
                  { value: '1.5', label: '1.5 mm' },
                  { value: '2', label: '2 mm' },
                  { value: '2.5', label: '2.5 mm' },
                  { value: '3', label: '3 mm' },
                  { value: '3.5', label: '3.5 mm' },
                  { value: '4', label: '4 mm' },
                  { value: '4.5', label: '4.5 mm' },
                  { value: '5', label: '5 mm' },
                  { value: '5.5', label: '5.5 mm' },
                  { value: '6', label: '6 mm' },
                  { value: '6.5', label: '6.5 mm' },
                  { value: '7', label: '7 mm' },
                  { value: '7.5', label: '7.5 mm' },
                  { value: '8', label: '8 mm' },
                  { value: '8.5', label: '8.5 mm' },
                  { value: '9', label: '9 mm' },
                  { value: '9.5', label: '9.5 mm' },
                  { value: '10', label: '10 mm' },
                  { value: '10.5', label: '10.5 mm' },
                  { value: '11', label: '11 mm' },
                  { value: '11.5', label: '11.5 mm' },
                  { value: '12', label: '12 mm' },
                  { value: '12.5', label: '12.5 mm' },
                  { value: '13', label: '13 mm' },
                  { value: '13.5', label: '13.5 mm' },
                  { value: '14', label: '14 mm' },
                  { value: '14.5', label: '14.5 mm' },
                  { value: '15', label: '15 mm' },
                ]}
              />

              <Select
                label={t('inventory.handleType')}
                value={hookHandleType}
                onChange={setHookHandleType}
                options={[
                  { value: 'standard', label: t('inventory.handleType_standard') },
                  { value: 'ergonomic', label: t('inventory.handleType_ergonomic') },
                  { value: 'tunisian', label: t('inventory.handleType_tunisian') },
                  { value: 'steel', label: t('inventory.handleType_steel') },
                  { value: 'inline', label: t('inventory.handleType_inline') },
                  { value: 'tapered', label: t('inventory.handleType_tapered') },
                ]}
              />

              <Select
                label={t('inventory.material')}
                value={hookMaterial}
                onChange={setHookMaterial}
                options={[
                  { value: 'steel', label: t('inventory.material_steel') },
                  { value: 'aluminum', label: t('inventory.material_aluminum') },
                  { value: 'bamboo', label: t('inventory.material_bamboo') },
                  { value: 'wood', label: t('inventory.material_wood') },
                  { value: 'plastic', label: t('inventory.material_plastic') },
                  { value: 'nickel', label: t('inventory.material_nickel') },
                  { value: 'brass', label: t('inventory.material_brass') },
                  { value: 'other', label: t('inventory.material_other') },
                ]}
              />

              <SectionHeader title={t('inventory.purchaseInfo')} />

              <Input
                label={t('inventory.store')}
                placeholder="e.g., Local craft store"
                value={hookStore}
                onChangeText={setHookStore}
              />

              <DatePicker
                label={t('inventory.purchaseDate')}
                value={hookPurchaseDate}
                onChange={setHookPurchaseDate}
                placeholder={t('inventory.selectPurchaseDate')}
                maxDate={new Date()}
              />

              <Input
                label={t('inventory.price')}
                placeholder="0.00"
                value={hookPurchasePrice}
                onChangeText={setHookPurchasePrice}
                keyboardType="decimal-pad"
              />

              <SectionHeader title={t('inventory.storageSection')} />

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
              <SectionHeader title={t('inventory.itemDetails')} />

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

              <SectionHeader title={t('inventory.purchaseInfo')} />

              <Input
                label={t('inventory.store')}
                placeholder="e.g., Local craft store"
                value={otherStore}
                onChangeText={setOtherStore}
              />

              <DatePicker
                label={t('inventory.purchaseDate')}
                value={otherPurchaseDate}
                onChange={setOtherPurchaseDate}
                placeholder={t('inventory.selectPurchaseDate')}
                maxDate={new Date()}
              />

              <Input
                label={t('inventory.price')}
                placeholder="0.00"
                value={otherPurchasePrice}
                onChangeText={setOtherPurchasePrice}
                keyboardType="decimal-pad"
              />

              <SectionHeader title={t('inventory.storageSection')} />

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
    borderWidth: normalizeBorder(1),
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
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  imageSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  footer: {
    marginTop: 24,
    marginBottom: 32,
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
  selectedProjectsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  projectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sage,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 180,
  },
  projectChipText: {
    ...Typography.body,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  projectChipRemove: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  selectProjectsButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.sage,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectProjectsButtonText: {
    ...Typography.body,
    color: Colors.sage,
    fontSize: 14,
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
  // Quantity stepper styles
  quantitySection: {
    marginBottom: 20,
  },
  quantityLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    marginBottom: 12,
    fontWeight: '500' as const,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: Colors.border,
  },
  quantityValue: {
    ...Typography.title2,
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.charcoal,
    minWidth: 48,
    textAlign: 'center',
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