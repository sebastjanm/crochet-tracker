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
import { X, QrCode, Barcode } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<'qr' | 'barcode'>('qr');
  const [permission, requestPermission] = useCameraPermissions();
  
  // Yarn specific fields
  const [brand, setBrand] = useState('');
  const [composition, setComposition] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [needleSize, setNeedleSize] = useState('');
  const [crochetHookSize, setCrochetHookSize] = useState('');
  const [country, setCountry] = useState('');
  const [gauge, setGauge] = useState('');
  const [certificate, setCertificate] = useState('');
  const [colorName, setColorName] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [dyelot, setDyelot] = useState('');
  const [barcode, setBarcode] = useState('');
  
  // Hook specific fields
  const [hookSize, setHookSize] = useState('');

  const categories = [
    { id: 'yarn', label: t('inventory.yarn') },
    { id: 'hook', label: t('inventory.hook') },
    { id: 'other', label: t('inventory.other') },
  ];



  const lookupBarcode = async (barcodeData: string) => {
    try {
      setLoading(true);
      setBarcode(barcodeData);
      
      // Try UPCitemdb API
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcodeData}`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        
        // Extract relevant information
        if (item.title) {
          setTitle(item.title);
        }
        if (item.brand) {
          setBrand(item.brand);
        }
        if (item.description) {
          setDescription(item.description);
        }
        
        Alert.alert(
          t('inventory.productFound'), 
          `${t('inventory.found')}: ${item.title || 'Unknown'}${item.brand ? ' by ' + item.brand : ''}\n\n${t('inventory.reviewInfo')}`
        );
      } else {
        Alert.alert(
          t('inventory.productNotFound'), 
          `${t('inventory.barcode')} ${barcodeData} ${t('inventory.scannedButNotFound')}`
        );
      }
    } catch (error) {
      console.log('Barcode lookup error:', error);
      Alert.alert(
        t('inventory.lookupFailed'), 
        `${t('inventory.barcode')} ${barcodeData} ${t('inventory.scannedButFailed')}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    console.log(`${scannerMode === 'qr' ? 'QR' : 'Bar'}code scanned:`, data);
    setShowScanner(false);
    
    if (scannerMode === 'barcode') {
      lookupBarcode(data);
    } else {
      // Parse QR code data
      try {
        const parsed = JSON.parse(data);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.brand) setBrand(parsed.brand);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.composition) setComposition(parsed.composition);
        if (parsed.weight) setWeight(parsed.weight.toString());
        if (parsed.length) setLength(parsed.length.toString());
        if (parsed.colorName) setColorName(parsed.colorName);
        Alert.alert(t('common.success'), t('inventory.qrImported'));
      } catch {
        const lines = data.split('\n');
        if (lines.length > 0) {
          setTitle(lines[0]);
          if (lines.length > 1) setDescription(lines.slice(1).join(' '));
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
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('inventory.enterItemTitle'));
      return;
    }

    setLoading(true);
    try {
      const yarnDetails: YarnDetails | undefined = category === 'yarn' ? {
        brand,
        composition,
        weight: weight ? parseFloat(weight) : undefined,
        length: length ? parseFloat(length) : undefined,
        needleSize,
        crochetHookSize,
        country,
        gauge,
        certificate,
        colorName,
        colorCode,
        dyelot,
        barcode,
      } : undefined;

      const hookDetails: HookDetails | undefined = category === 'hook' ? {
        size: hookSize,
      } : undefined;

      await addItem({
        category,
        title,
        description,
        images,
        quantity: parseInt(quantity) || 1,
        yarnDetails,
        hookDetails,
        notes,
      });
      router.back();
    } catch (error) {
      Alert.alert(t('common.error'), t('inventory.failedToAddItem'));
    } finally {
      setLoading(false);
    }
  };

  if (showScanner && Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowScanner(false)} style={styles.closeButton}>
            <X size={24} color={Colors.charcoal} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('inventory.scan')} {scannerMode === 'qr' ? 'QR Code' : t('inventory.barcode')}</Text>
          <View style={styles.placeholder} />
        </View>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('inventory.addToInventory')}</Text>
        <View style={styles.placeholder} />
      </View>

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
              >
                <QrCode size={22} color={Colors.white} strokeWidth={2} />
                <Text style={styles.scanButtonText}>{t('inventory.scanQR')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scanButton, styles.barcodeButton]}
                onPress={() => openScanner('barcode')}
                activeOpacity={0.7}
              >
                <Barcode size={22} color={Colors.white} strokeWidth={2} />
                <Text style={styles.scanButtonText}>{t('inventory.scanBarcode')}</Text>
              </TouchableOpacity>
            </View>
          )}

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
          
          <Input
            label={t('inventory.itemName')}
            placeholder={t('inventory.enterItemName')}
            value={title}
            onChangeText={setTitle}
          />

          {category === 'yarn' && (
            <Input
              label={t('inventory.brand')}
              placeholder="e.g., ALIZE"
              value={brand}
              onChangeText={setBrand}
            />
          )}

          <Input
            label={t('inventory.description')}
            placeholder={t('inventory.describeItem')}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            style={styles.textArea}
          />

          {category === 'yarn' && (
            <>
              <Text style={styles.sectionTitle}>{t('inventory.technicalSpecs')}</Text>
              
              <Input
                label={t('inventory.composition')}
                placeholder="e.g., 80% Acrylic, 20% Wool"
                value={composition}
                onChangeText={setComposition}
              />
              
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label={`${t('inventory.weight')} (g)`}
                    placeholder="100"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label={`${t('inventory.length')} (m)`}
                    placeholder="550"
                    value={length}
                    onChangeText={setLength}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label={t('inventory.needleSize')}
                    placeholder="e.g., 2.0-5.0"
                    value={needleSize}
                    onChangeText={setNeedleSize}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label={t('inventory.crochetHookSize')}
                    placeholder="e.g., 1.0-4.0"
                    value={crochetHookSize}
                    onChangeText={setCrochetHookSize}
                  />
                </View>
              </View>

              <Input
                label={t('inventory.gauge')}
                placeholder="e.g., 10x10cm = 28 stitches x 36 rows"
                value={gauge}
                onChangeText={setGauge}
              />

              <Text style={styles.sectionTitle}>{t('inventory.colorInfo')}</Text>
              
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label={t('inventory.colorName')}
                    placeholder="e.g., Forest Green"
                    value={colorName}
                    onChangeText={setColorName}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label={t('inventory.colorCode')}
                    placeholder="e.g., #234"
                    value={colorCode}
                    onChangeText={setColorCode}
                  />
                </View>
              </View>

              <Input
                label={t('inventory.dyelot')}
                placeholder={t('inventory.enterDyelot')}
                value={dyelot}
                onChangeText={setDyelot}
              />

              <Text style={styles.sectionTitle}>{t('inventory.additionalInfo')}</Text>
              
              <Input
                label={t('inventory.country')}
                placeholder="e.g., Turkey"
                value={country}
                onChangeText={setCountry}
              />

              <Input
                label={t('inventory.certificate')}
                placeholder="e.g., Oeko-Tex Standard 100"
                value={certificate}
                onChangeText={setCertificate}
              />

              {barcode && (
                <Input
                  label={t('inventory.barcode')}
                  value={barcode}
                  onChangeText={setBarcode}
                  editable={false}
                />
              )}
            </>
          )}

          {category === 'hook' && (
            <Input
              label={t('inventory.size')}
              placeholder="e.g., 5mm"
              value={hookSize}
              onChangeText={setHookSize}
            />
          )}

          <Input
            label={t('inventory.quantity')}
            placeholder="1"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          <Input
            label={t('inventory.notes')}
            placeholder={t('inventory.additionalNotes')}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
            style={styles.textArea}
          />

          <View style={styles.imageSection}>
            <Text style={styles.sectionLabel}>{t('inventory.photos')}</Text>
            <ImageGallery
              images={images}
              onImagesChange={setImages}
              maxImages={8}
              editable={true}
            />
          </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
  },
  placeholder: {
    width: 40,
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
    height: 80,
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