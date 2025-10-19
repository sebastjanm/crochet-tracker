import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, ImageIcon, Trash2, Plus } from 'lucide-react-native';
import { useImagePicker } from '@/hooks/useImagePicker';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/hooks/language-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageGalleryProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  editable?: boolean;
}

export function ImageGallery({
  images,
  onImagesChange,
  maxImages = 10,
  editable = true
}: ImageGalleryProps) {
  const { t } = useLanguage();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
  const { showImagePickerOptions, isPickingImage } = useImagePicker();

  const handleImageLoad = (index: number) => {
    setLoadingImages((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageLoadStart = (index: number) => {
    setLoadingImages((prev) => ({ ...prev, [index]: true }));
  };

  const handleAddImages = async () => {
    const newImages = await showImagePickerOptions();
    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages].slice(0, maxImages);
      onImagesChange(updatedImages);
    }
  };

  const removeImage = (index: number) => {
    Alert.alert(
      t('common.confirm'),
      'Remove this image?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            const updatedImages = images.filter((_, i) => i !== index);
            onImagesChange(updatedImages);
            setSelectedImageIndex(null);
          },
        },
      ]
    );
  };



  const renderGalleryGrid = () => {
    const itemsPerRow = 3;
    const imageSize = (screenWidth - 48 - (itemsPerRow - 1) * 8) / itemsPerRow;

    return (
      <View style={styles.galleryGrid}>
        {images.map((image, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.galleryItem, { width: imageSize, height: imageSize }]}
            onPress={() => setSelectedImageIndex(index)}
          >
            <Image
              source={{ uri: image }}
              style={styles.galleryImage}
              onLoadStart={() => handleImageLoadStart(index)}
              onLoad={() => handleImageLoad(index)}
              onError={() => handleImageLoad(index)}
            />
            {loadingImages[index] && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={Colors.teal} />
              </View>
            )}
          </TouchableOpacity>
        ))}
        
        {editable && images.length < maxImages && (
          <TouchableOpacity
            style={[styles.addImageButton, { width: imageSize, height: imageSize }]}
            onPress={handleAddImages}
            disabled={isPickingImage}
          >
            <Plus size={24} color={Colors.warmGray} />
            <Text style={styles.addImageText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFullScreenModal = () => {
    if (selectedImageIndex === null) return null;

    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImageIndex(null)}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedImageIndex(null)}
          >
            <X size={24} color={Colors.white} />
          </TouchableOpacity>
          
          {editable && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => removeImage(selectedImageIndex)}
            >
              <Trash2 size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: selectedImageIndex * screenWidth, y: 0 }}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setSelectedImageIndex(newIndex);
            }}
          >
            {images.map((image, index) => (
              <View key={index} style={styles.fullScreenImageContainer}>
                <Image
                  source={{ uri: image }}
                  style={styles.fullScreenImage}
                  onLoadStart={() => handleImageLoadStart(index)}
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageLoad(index)}
                />
                {loadingImages[index] && (
                  <View style={styles.fullScreenLoadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.white} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {selectedImageIndex + 1} / {images.length}
            </Text>
          </View>
        </View>
      </Modal>
    );
  };



  return (
    <View style={styles.container}>
      {images.length > 0 ? renderGalleryGrid() : (
        editable && (
          <TouchableOpacity style={styles.emptyGallery} onPress={handleAddImages} disabled={isPickingImage}>
            <ImageIcon size={48} color={Colors.warmGray} />
            <Text style={styles.emptyGalleryText}>Add your first image</Text>
            <Text style={styles.emptyGallerySubtext}>Tap to add from camera or gallery</Text>
          </TouchableOpacity>
        )
      )}
      
      {renderFullScreenModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginTop: 4,
  },
  emptyGallery: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyGalleryText: {
    ...Typography.body,
    color: Colors.charcoal,
    marginTop: 12,
    fontWeight: '600' as const,
  },
  emptyGallerySubtext: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginTop: 4,
    textAlign: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    borderRadius: 20,
    padding: 8,
  },
  fullScreenImageContainer: {
    width: screenWidth,
    height: screenHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenWidth,
    resizeMode: 'contain',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  imageCounterText: {
    ...Typography.body,
    color: Colors.white,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fullScreenLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});