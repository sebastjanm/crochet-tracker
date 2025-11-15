import React, { useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
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

export const ImageGallery = memo(function ImageGallery({
  images,
  onImagesChange,
  maxImages = 10,
  editable = true
}: ImageGalleryProps) {
  const { t } = useLanguage();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
  const { showImagePickerOptions, isPickingImage } = useImagePicker();

  const handleImageLoad = useCallback((index: number) => {
    setLoadingImages((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  const handleImageLoadStart = useCallback((index: number) => {
    setLoadingImages((prev) => ({ ...prev, [index]: true }));
  }, []);

  const handleAddImages = useCallback(async () => {
    const newImages = await showImagePickerOptions();
    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages].slice(0, maxImages);
      onImagesChange(updatedImages);
    }
  }, [images, maxImages, onImagesChange, showImagePickerOptions]);

  const removeImage = useCallback((index: number) => {
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
  }, [images, onImagesChange, t]);



  const renderCarousel = () => {
    const carouselHeight = screenWidth * 0.8; // 80% of screen width for aspect ratio

    return (
      <View style={styles.carouselContainer}>
        {/* Horizontal scrollable carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={true}
          decelerationRate="fast"
          snapToInterval={screenWidth}
          snapToAlignment="start"
          style={[styles.carouselWrapper, { height: carouselHeight }]}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
            setCurrentCarouselIndex(newIndex);
          }}
          scrollEventThrottle={16}
        >
          {images.map((image, index) => (
            <TouchableOpacity
              key={`${image}-${index}`}
              style={[styles.carouselItem, { width: screenWidth, height: carouselHeight }]}
              onPress={() => setSelectedImageIndex(index)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: image }}
                style={styles.carouselImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                priority="high"
                onLoadStart={() => handleImageLoadStart(index)}
                onLoad={() => handleImageLoad(index)}
                onError={() => handleImageLoad(index)}
              />
              {loadingImages[index] && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.deepTeal} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Overlay wrapper for floating controls */}
        <View style={styles.controlsOverlay} pointerEvents="box-none">

        {/* Floating delete button - top right */}
        {editable && images.length > 0 && (
          <TouchableOpacity
            style={styles.floatingDeleteButton}
            onPress={() => removeImage(currentCarouselIndex)}
          >
            <Trash2 size={20} color={Colors.white} />
          </TouchableOpacity>
        )}

        {/* Floating add button - bottom right */}
        {editable && images.length < maxImages && (
          <TouchableOpacity
            style={styles.floatingAddButton}
            onPress={handleAddImages}
            disabled={isPickingImage}
          >
            <Plus size={24} color={Colors.white} />
          </TouchableOpacity>
        )}

        {/* Image counter badge - bottom center */}
        {images.length > 1 && (
          <View style={styles.carouselCounter}>
            <Text style={styles.carouselCounterText}>
              {currentCarouselIndex + 1} / {images.length}
            </Text>
          </View>
        )}
        </View>
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
            removeClippedSubviews={true}
            scrollEventThrottle={16}
            snapToInterval={screenWidth}
            snapToAlignment="start"
            decelerationRate="fast"
            contentOffset={{ x: selectedImageIndex * screenWidth, y: 0 }}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setSelectedImageIndex(newIndex);
            }}
          >
            {images.map((image, index) => (
              <View key={`${image}-${index}-fullscreen`} style={styles.fullScreenImageContainer}>
                <Image
                  source={{ uri: image }}
                  style={styles.fullScreenImage}
                  contentFit="contain"
                  transition={200}
                  cachePolicy="memory-disk"
                  priority="high"
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
      {images.length > 0 ? renderCarousel() : (
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselContainer: {
    width: '100%',
    position: 'relative',
  },
  carouselWrapper: {
    backgroundColor: Colors.beige,
    overflow: 'hidden',
  },
  carouselItem: {
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
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
  floatingDeleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: Colors.deepTeal,
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  carouselCounter: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  carouselCounterText: {
    ...Typography.caption,
    color: Colors.white,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: '600' as const,
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