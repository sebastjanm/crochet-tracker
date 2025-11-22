import React, { useState, useRef } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullscreenImageModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

export function FullscreenImageModal({ visible, imageUri, onClose }: FullscreenImageModalProps) {
  const { t } = useLanguage();
  const [isZoomed, setIsZoomed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const lastTap = useRef<number>(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - toggle zoom
      const newZoomState = !isZoomed;
      setIsZoomed(newZoomState);

      Animated.spring(scale, {
        toValue: newZoomState ? 2 : 1,
        useNativeDriver: true,
        friction: 7,
      }).start();
    }

    lastTap.current = now;
  };

  const handleClose = () => {
    // Reset zoom when closing
    setIsZoomed(false);
    scale.setValue(1);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <X size={24} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDoubleTap}
          style={styles.imageWrapper}
        >
          {imageUri && (
            <Animated.View
              style={[
                styles.imageContainer,
                {
                  transform: [{ scale }],
                },
              ]}
            >
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
              />
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
