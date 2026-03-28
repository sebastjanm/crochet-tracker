/**
 * Image Picker Hook
 *
 * Provides image selection from gallery and camera with:
 * - Smart compression (max 1920px width, 80% JPEG quality)
 * - Automatic copy to permanent storage (prevents cache loss)
 * - Consistent { success, data, error } return pattern
 * - Permission handling with user-friendly prompts
 *
 * Compression: A 12MB iPhone HEIC → ~300KB JPEG (40x smaller)
 *
 * @example
 * ```tsx
 * const { pickImages, takePhoto, isPickingImage } = useImagePicker();
 *
 * const result = await pickImages();
 * if (result.success) {
 *   setImages(result.data); // string[]
 * } else {
 *   showToast(result.error.message, 'error');
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { File as ExpoFile, Directory, Paths } from 'expo-file-system';
import { Alert } from 'react-native';
import type { ActionResult } from '@/types';

// Compression settings for optimal file size vs quality balance
const MAX_IMAGE_WIDTH = 1920;
const JPEG_QUALITY = 0.8;

/**
 * Compress and resize an image for optimal storage and upload.
 * - Resizes to max 1920px width (preserves aspect ratio)
 * - Converts to JPEG at 80% quality
 * - A 12MB iPhone HEIC becomes ~300KB JPEG
 *
 * @param uri - Source image URI
 * @returns Compressed image URI (or original if compression fails)
 */
async function compressImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_IMAGE_WIDTH } }],
      {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: JPEG_QUALITY,
      }
    );

    if (__DEV__) {
      // Log size reduction for debugging
      const originalFile = new ExpoFile(uri);
      const compressedFile = new ExpoFile(result.uri);
      const originalSize = originalFile.exists ? originalFile.size : 0;
      const compressedSize = compressedFile.exists ? compressedFile.size : 0;
      const reduction = originalSize > 0
        ? Math.round((1 - compressedSize / originalSize) * 100)
        : 0;
      console.log(
        `[ImagePicker] Compressed: ${Math.round(originalSize / 1024)}KB → ${Math.round(compressedSize / 1024)}KB (${reduction}% reduction)`
      );
    }

    return result.uri;
  } catch (error) {
    if (__DEV__) {
      console.warn('[ImagePicker] Compression failed, using original:', error);
    }
    return uri; // Fallback to original if compression fails
  }
}

/**
 * Copy a picked image from temp cache to permanent storage.
 * ImagePicker files in Library/Caches/ImagePicker/ are temporary
 * and can be deleted by iOS at any time.
 *
 * Uses SDK 54 expo-file-system API with File/Directory/Paths.
 */
async function copyToPermanentStorage(tempUri: string): Promise<ActionResult<string>> {
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
    return { success: true, data: destFile.uri };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (__DEV__) console.error('[ImagePicker] Failed to copy to permanent storage:', err);
    // Return original URI as fallback (may fail later if cache is cleared)
    return { success: true, data: tempUri };
  }
}

/**
 * Hook for picking images from gallery or camera.
 * Automatically copies images to permanent storage to prevent cache loss.
 */
export function useImagePicker() {
  const [isPickingImage, setIsPickingImage] = useState(false);

  /**
   * Pick multiple images from gallery.
   * Returns { success: true, data: string[] } or { success: false, error: Error }
   */
  const pickImagesFromGallery = useCallback(async (): Promise<ActionResult<string[]>> => {
    try {
      setIsPickingImage(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: new Error('Permission to access photos was denied'),
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        allowsEditing: false, // Editing disabled for multi-select
        quality: 0.8,
        base64: false,
      });

      if (result.canceled) {
        return { success: true, data: [] }; // User cancelled - not an error
      }

      if (!result.assets || result.assets.length === 0) {
        return { success: true, data: [] };
      }

      // Compress and copy all picked images to permanent storage
      const copyResults = await Promise.all(
        result.assets.map(async (asset) => {
          const compressed = await compressImage(asset.uri);
          return copyToPermanentStorage(compressed);
        })
      );

      // Collect successful copies
      const permanentUris = copyResults
        .filter((r): r is { success: true; data: string } => r.success)
        .map(r => r.data);

      return { success: true, data: permanentUris };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (__DEV__) console.error('[ImagePicker] Error picking images:', err);
      return { success: false, error: err };
    } finally {
      setIsPickingImage(false);
    }
  }, []);

  /**
   * Take a photo with the camera.
   * Returns { success: true, data: string } or { success: false, error: Error }
   */
  const takePhotoWithCamera = useCallback(async (): Promise<ActionResult<string | null>> => {
    try {
      setIsPickingImage(true);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: new Error('Permission to use camera was denied'),
        };
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // Accept photos without forced cropping
        quality: 0.8,
        base64: false,
      });

      if (result.canceled) {
        return { success: true, data: null }; // User cancelled - not an error
      }

      if (!result.assets || result.assets.length === 0) {
        return { success: true, data: null };
      }

      // Compress and copy to permanent storage
      const compressed = await compressImage(result.assets[0].uri);
      const copyResult = await copyToPermanentStorage(compressed);
      if (copyResult.success) {
        return { success: true, data: copyResult.data };
      }

      return copyResult as ActionResult<string | null>;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (__DEV__) console.error('[ImagePicker] Error taking photo:', err);
      return { success: false, error: err };
    } finally {
      setIsPickingImage(false);
    }
  }, []);

  /**
   * Show options dialog and pick a single image (from gallery or camera).
   * Returns { success: true, data: string | null } or { success: false, error: Error }
   */
  const showImagePickerOptions = useCallback(async (): Promise<ActionResult<string | null>> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Add Photo',
        'Choose how you want to add a photo',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const result = await takePhotoWithCamera();
              resolve(result);
            }
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              const result = await pickImagesFromGallery();
              if (result.success) {
                resolve({
                  success: true,
                  data: result.data.length > 0 ? result.data[0] : null
                });
              } else {
                resolve(result as ActionResult<string | null>);
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve({ success: true, data: null })
          }
        ]
      );
    });
  }, [takePhotoWithCamera, pickImagesFromGallery]);

  /**
   * Show options dialog and pick multiple images.
   * Returns { success: true, data: string[] } or { success: false, error: Error }
   */
  const showImagePickerOptionsMultiple = useCallback(async (): Promise<ActionResult<string[]>> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Add Photos',
        'Choose how you want to add photos',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const result = await takePhotoWithCamera();
              if (result.success) {
                resolve({
                  success: true,
                  data: result.data ? [result.data] : []
                });
              } else {
                resolve(result as ActionResult<string[]>);
              }
            }
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              const result = await pickImagesFromGallery();
              resolve(result);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve({ success: true, data: [] })
          }
        ]
      );
    });
  }, [takePhotoWithCamera, pickImagesFromGallery]);

  return {
    /** Whether an image picker operation is in progress */
    isPickingImage,
    /** Pick multiple images from gallery */
    pickImagesFromGallery,
    /** Take a photo with camera */
    takePhotoWithCamera,
    /** Show picker dialog for single image */
    showImagePickerOptions,
    /** Show picker dialog for multiple images */
    showImagePickerOptionsMultiple,
  };
}
