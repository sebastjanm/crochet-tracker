import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
  rightAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
}

export function ModalHeader({ 
  title, 
  onClose,
  rightAction 
}: ModalHeaderProps) {
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Use dismiss() for modals to properly close them
      // Falls back to back() if dismiss is not available
      try {
        router.dismiss();
      } catch {
        if (router.canGoBack()) {
          router.back();
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleClose}
        style={styles.closeButton}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Close"
        accessibilityHint="Closes this screen and returns to the previous screen"
      >
        <X size={24} color={Colors.charcoal} strokeWidth={2.5} />
      </TouchableOpacity>
      
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      
      {rightAction ? (
        <TouchableOpacity 
          onPress={rightAction.onPress}
          disabled={rightAction.disabled}
          style={[styles.actionButton, rightAction.disabled && styles.actionButtonDisabled]}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, rightAction.disabled && styles.actionTextDisabled]}>
            {rightAction.label}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.sage + '20',
    backgroundColor: Colors.white,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.sage + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.headline,
    color: Colors.charcoal,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.deepSage,
  },
  actionButtonDisabled: {
    backgroundColor: Colors.sage + '30',
  },
  actionText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  actionTextDisabled: {
    color: Colors.charcoal + '50',
  },
  placeholder: {
    width: 32,
  },
});