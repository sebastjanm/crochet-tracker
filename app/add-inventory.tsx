import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { QrCode, Barcode } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { ImageGallery } from '@/components/ImageGallery';
import { useInventory } from '@/hooks/inventory-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { InventoryItem, YarnDetails, HookDetails } from '@/types';
import { useLanguage } from '@/hooks/language-context';

export default function AddInventoryScreen() {
  const { addItem } = useInventory();
  const { t } = useLanguage();
  const [category, setCategory] = useState<InventoryItem['category']>('yarn');
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

  // Hook specific fields
  const [hookName, setHookName] = useState('');
  const [hookSize, setHookSize] = useState('');

  // Other specific fields
  const [otherName, setOtherName] = useState('');

  const categories = [
    { id: 'yarn', label: t('inventory.yarn') },
    { id: 'hook', label: t('inventory.hook') },
    { id: 'other', label: t('inventory.other') },
  ];



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
        colorName: color.trim() || undefined,
        colorCode: colorCode.trim() || undefined,
        fiber: fiber.trim() || '',
        weightCategory: weightCategory.trim() || '',
        ballWeightG: ballWeightNum || 0,
        lengthM: lengthNum || 0,
        hookSizeMm: recommendedHookSize.trim() || undefined,
        storageLocation: storage.trim() || undefined,
        store: store.trim() || undefined,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        purchasePrice: priceNum,
      } : undefined;

      const hookDetails: HookDetails | undefined = category === 'hook' ? {
        size: hookSize.trim() || undefined,
        storageLocation: storage.trim() || undefined,
      } : undefined;

      const otherDetails = category === 'other' ? {
        storageLocation: storage.trim() || undefined,
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
                label={t('inventory.brand')}
                placeholder={t('inventory.brandPlaceholder')}
                value={brand}
                onChangeText={setBrand}
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
                placeholder={t('inventory.hookSizePlaceholder')}
                value={recommendedHookSize}
                onChangeText={setRecommendedHookSize}
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
                placeholder="YYYY-MM-DD"
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
                label={t('inventory.size')}
                placeholder="e.g., 5mm"
                value={hookSize}
                onChangeText={setHookSize}
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
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerText: {
    ...Typography.body,
    color: Colors.white,
    marginTop: 20,
  },
});