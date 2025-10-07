import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export const useImagePicker = () => {
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets) {
        return result.assets.map(asset => asset.uri);
      }
      return [];
    } catch (error) {
      console.error('Error picking images:', error);
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
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    } finally {
      setIsPickingImage(false);
    }
  };

  const showImagePickerOptions = async (): Promise<string[]> => {
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
    showImagePickerOptions
  };
};