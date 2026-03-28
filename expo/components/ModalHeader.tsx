import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, HelpCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
  showHelp?: boolean;
  helpSection?: 'projects' | 'inventory' | 'yarn' | 'hooks' | 'materials' | 'photos';
  rightAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
}

export function ModalHeader({
  title,
  onClose,
  showHelp = false,
  helpSection,
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

  const handleHelp = () => {
    if (helpSection) {
      router.push(`/help/faq?section=${helpSection}`);
    } else {
      router.push('/help/faq');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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

      <View style={styles.rightSection}>
        {showHelp && (
          <TouchableOpacity
            onPress={handleHelp}
            style={styles.helpButton}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Help"
            accessibilityHint="Opens help and FAQ section"
          >
            <HelpCircle size={22} color={Colors.deepSage} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.white,
  },
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.sage + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
});