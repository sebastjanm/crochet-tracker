import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';

interface DarkHeaderProps {
  /** Main title displayed in the header */
  title: string;
  /** Optional subtitle displayed below the title */
  subtitle?: string;
  /** Button variant: 'close' shows X icon, 'back' shows ChevronLeft with label */
  variant?: 'close' | 'back';
  /** Custom back/close button label (only used with 'back' variant) */
  backLabel?: string;
  /** Custom onPress handler, defaults to router.back() */
  onPress?: () => void;
  /** Accessibility label for the button */
  accessibilityLabel?: string;
}

/**
 * DarkHeader - Reusable dark-themed header component for full-page screens.
 *
 * Used for: Legal pages, About, Help pages, and other non-modal screens
 * that need a dark green header with white text.
 *
 * @example
 * // Close button variant (for hub/index pages)
 * <DarkHeader title="Legal" subtitle="Terms and policies" variant="close" />
 *
 * @example
 * // Back button variant (for detail pages)
 * <DarkHeader title="Terms of Service" variant="back" backLabel="Back" />
 */
export function DarkHeader({
  title,
  subtitle,
  variant = 'close',
  backLabel = 'Back',
  onPress,
  accessibilityLabel,
}: DarkHeaderProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  const defaultAccessibilityLabel = variant === 'close' ? 'Close' : 'Go back';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerWrapper}>
        <View style={styles.headerRow}>
          {variant === 'close' ? (
            <TouchableOpacity
              onPress={handlePress}
              style={styles.closeButton}
              accessibilityLabel={accessibilityLabel || defaultAccessibilityLabel}
              accessibilityRole="button"
            >
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handlePress}
              style={styles.backButton}
              accessibilityLabel={accessibilityLabel || defaultAccessibilityLabel}
              accessibilityRole="button"
            >
              <ChevronLeft size={24} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.backLabel}>{backLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.headerBg,
  },
  headerWrapper: {
    backgroundColor: Colors.headerBg,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  backLabel: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
});
