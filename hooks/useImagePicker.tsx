import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { File as ExpoFile, Directory, Paths } from 'expo-file-system';
import { Alert } from 'react-native';

/**
 * Copy a picked image from temp cache to permanent storage.
 * ImagePicker files in Library/Caches/ImagePicker/ are temporary
 * and can be deleted by iOS at any time.
 *
 * Uses SDK 54 expo-file-system API with File/Directory/Paths.
 */
async function copyToPermanentStorage(tempUri: string): Promise<string> {
  try {
    // Create images directory in document storage
    const imagesDir = new Directory(Paths.document, 'images');
    if (!imagesDir.exists) {
      imagesDir.create();
    }

    // Generate unique filename preserving extension
    const extension = tempUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;

    // Create source file reference and copy to permanent location
    const sourceFile = new ExpoFile(tempUri);
    const destFile = new ExpoFile(imagesDir, fileName);

    sourceFile.copy(destFile);

    if (__DEV__) console.log('[ImagePicker] Copied to permanent storage:', destFile.uri);
    return destFile.uri;
  } catch (error) {
    if (__DEV__) console.error('[ImagePicker] Failed to copy to permanent storage:', error);
    // Return original URI as fallback (may fail later if cache is cleared)
    return tempUri;
  }
}

/**
 * Hook for picking images from gallery or camera.
 * Automatically copies images to permanent storage to prevent cache loss.
 */
export function useImagePicker() {
  const [isPickingImage, setIsPickingImage] = useState(false);

  const pickImagesFromGallery = async (): Promise<string[]> => {
    try {
      setIsPickingImage(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        allowsEditing: false, // Editing disabled for multi-select
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets) {
        // Copy all picked images to permanent storage
        const permanentUris = await Promise.all(
          result.assets.map(asset => copyToPermanentStorage(asset.uri))
        );
        return permanentUris;
      }
      return [];
    } catch (error) {
      if (__DEV__) console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
      return [];
    } finally {
      setIsPickingImage(false);
    }
  };

  const takePhotoWithCamera = async (): Promise<string | null> => {
    try {
      setIsPickingImage(true);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to use the camera');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // Accept photos without forced cropping
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Copy to permanent storage
        return await copyToPermanentStorage(result.assets[0].uri);
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    } finally {
      setIsPickingImage(false);
    }
  };


  const showImagePickerOptions = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Add Photo',
        'Choose how you want to add a photo',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const photo = await takePhotoWithCamera();
              resolve(photo);
            }
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              const photos = await pickImagesFromGallery();
              // Return first photo from gallery selection
              resolve(photos.length > 0 ? photos[0] : null);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null)
          }
        ]
      );
    });
  };

  const showImagePickerOptionsMultiple = async (): Promise<string[]> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Add Photos',
        'Choose how you want to add photos',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const photo = await takePhotoWithCamera();
              resolve(photo ? [photo] : []);
            }
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              const photos = await pickImagesFromGallery();
              resolve(photos);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve([])
          }
        ]
      );
    });
  };

  return {
    isPickingImage,
    pickImagesFromGallery,
    takePhotoWithCamera,
    showImagePickerOptions,
    showImagePickerOptionsMultiple,
  };
}