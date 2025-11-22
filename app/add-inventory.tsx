import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { QrCode, Barcode } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { ImageGallery } from '@/components/ImageGallery';
import { useInventory } from '@/hooks/inventory-context';
import { useProjects } from '@/hooks/projects-context';
import { useAuth } from '@/hooks/auth-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, cardShadow, buttonShadow } from '@/constants/pixelRatio';
import { InventoryItem, YarnDetails, HookDetails } from '@/types';
import { useLanguage } from '@/hooks/language-context';

export default function AddInventoryScreen() {
  const params = useLocalSearchParams();
  const { addItem } = useInventory();
  const { projects } = useProjects();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [category, setCategory] = useState<InventoryItem['category']>(
    (params.category as InventoryItem['category']) || 'yarn'
  );
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<'qr' | 'barcode'>('qr');
  const [permission, requestPermission] = useCameraPermissions();

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

  const categories = [
    { id: 'yarn', label: t('inventory.yarn') },
    { id: 'hook', label: t('inventory.hook') },
    { id: 'other', label: t('inventory.other') },
  ];

  // Auto-set unit based on category
  useEffect(() => {
    if (category === 'yarn') {
      setUnit('skein');
    } else {
      setUnit('piece');
    }
  }, [category]);



  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    console.log(`${scannerMode === 'qr' ? 'QR' : 'Bar'}code scanned:`, data);
    setShowScanner(false);

    if (scannerMode === 'barcode') {
      // Simple barcode scan - just show the value
      Alert.alert(t('inventory.barcodeScanned'), `Barcode: ${data}`);
    } else {
      // Parse QR code data (Simplified Fields)
      try {
        const parsed = JSON.parse(data);
        if (parsed.name) setYarnName(parsed.name);
        if (parsed.brand) setBrand(parsed.brand);
        if (parsed.color) setColor(parsed.color);
        if (parsed.color_code) setColorCode(parsed.color_code);
        if (parsed.fiber) setFiber(parsed.fiber);
        if (parsed.weight_category) setWeightCategory(parsed.weight_category);
        if (parsed.ball_weight) setBallWeight(parsed.ball_weight.toString());
        if (parsed.length) setLength(parsed.length.toString());
        if (parsed.hook_size) setRecommendedHookSize(parsed.hook_size);
        if (parsed.storage) setStorage(parsed.storage);
        if (parsed.store) setStore(parsed.store);
        if (parsed.quantity) setQuantity(parsed.quantity.toString());
        Alert.alert(t('common.success'), t('inventory.qrImported'));
      } catch {
        const lines = data.split('\n');
        if (lines.length > 0) {
          setDescription(lines.join(' '));
        }
        Alert.alert(t('inventory.qrScanned'), t('inventory.someInfoImported'));
      }
    }
  };

  const openScanner = async (mode: 'qr' | 'barcode') => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(t('inventory.permissionRequired'), t('inventory.cameraPermissionNeeded'));
        return;
      }
    }
    setScannerMode(mode);
    setShowScanner(true);
  };

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

  const handleSubmit = async () => {
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

    setLoading(true);
    try {
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

      await addItem({
        name: itemName,
        category,
        description,
        images,
        quantity: parseInt(quantity) || 1,
        unit,
        usedInProjects: usedInProjects.length > 0 ? usedInProjects : undefined,
        yarnDetails,
        hookDetails,
        otherDetails,
        notes,
      });
      router.dismiss();
    } catch (error) {
      Alert.alert(t('common.error'), t('inventory.failedToAddItem'));
    } finally {
      setLoading(false);
    }
  };

  if (showScanner && Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ModalHeader
          title={`${t('inventory.scan')} ${scannerMode === 'qr' ? 'QR Code' : t('inventory.barcode')}`}
          onClose={() => setShowScanner(false)}
        />
        <CameraView
          style={styles.scanner}
          facing={'back' as CameraType}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: scannerMode === 'qr' 
              ? ['qr', 'pdf417'] 
              : ['ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code128', 'codabar'],
          }}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerText}>{t('inventory.positionCode')} {scannerMode === 'qr' ? 'QR code' : t('inventory.barcode')} {t('inventory.withinFrame')}</Text>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalHeader title={t('inventory.addToInventory')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {Platform.OS !== 'web' && (
            <View style={styles.scannerButtons}>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => openScanner('qr')}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('inventory.scanQR')}
                accessibilityHint="Opens camera to scan QR codes for quick item import"
              >
                <QrCode size={22} color={Colors.white} strokeWidth={2} />
                <Text style={styles.scanButtonText}>{t('inventory.scanQR')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scanButton, styles.barcodeButton]}
                onPress={() => openScanner('barcode')}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('inventory.scanBarcode')}
                accessibilityHint="Opens camera to scan product barcodes for automatic lookup"
              >
                <Barcode size={22} color={Colors.white} strokeWidth={2} />
                <Text style={styles.scanButtonText}>{t('inventory.scanBarcode')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.imageSection}>
            <Text style={styles.sectionLabel}>{t('inventory.photos')}</Text>
            <ImageGallery
              images={images}
              onImagesChange={setImages}
              maxImages={8}
              editable={true}
            />
          </View>

          <View style={styles.categorySection}>
            <Text style={styles.sectionLabel}>{t('inventory.category')}</Text>
            <View style={styles.categoryButtons}>
              {categories.map(cat => (
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
              title={t('inventory.addItem')}
              onPress={handleSubmit}
              loading={loading}
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
    borderColor: Colors.sage,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
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
  thirdInput: {
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
  },
  scannerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.sage,
    borderRadius: 14,
    paddingVertical: 16,
    minHeight: 54,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  barcodeButton: {
    backgroundColor: Colors.terracotta,
  },
  scanButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: normalizeBorder(2),
    borderColor: Colors.white,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerText: {
    ...Typography.body,
    color: Colors.white,
    marginTop: 20,
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
    borderRadius: 10,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 48,
    justifyContent: 'center',
  },
  projectButtonActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.deepSage,
    borderWidth: normalizeBorder(2),
  },
  projectButtonText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 15,
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
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleTypeButtonActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.deepSage,
    borderWidth: normalizeBorder(2),
  },
  handleTypeButtonText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 13,
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.deepSage,
    borderWidth: normalizeBorder(2),
  },
  typeButtonText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 12,
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