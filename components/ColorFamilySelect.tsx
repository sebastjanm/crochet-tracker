import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { COLOR_FAMILIES, getColorByCode, isLightColor } from '@/constants/colorFamilies';
import { useLanguage } from '@/providers/LanguageProvider';

interface ColorFamilySelectProps {
  label: string;
  value?: string;
  onChange: (code: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function ColorFamilySelect({
  label,
  value,
  onChange,
  placeholder = 'Select color family',
  required = false,
  error,
}: ColorFamilySelectProps) {
  const [showModal, setShowModal] = useState(false);
  const { t } = useLanguage();

  const selectedColor = value ? getColorByCode(value) : undefined;
  const hasValue = !!selectedColor;

  const handleSelect = (code: string) => {
    onChange(code);
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  // Get translated label for a color
  const getColorLabel = (i18nKey: string): string => {
    return t(i18nKey) || i18nKey.split('.').pop() || '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.selectContainer}>
        <Text style={[styles.label, hasValue && styles.labelFloating]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>

        <TouchableOpacity
          style={[
            styles.selectButton,
            error && styles.selectButtonError,
          ]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${label}. ${selectedColor ? `Selected: ${getColorLabel(selectedColor.i18nKey)}` : placeholder}`}
          accessibilityHint="Double tap to change selection"
          accessibilityState={{ disabled: false }}
        >
          <View style={styles.selectContent}>
            {hasValue && selectedColor ? (
              <View style={styles.selectedValueRow}>
                <View
                  style={[
                    styles.colorSwatchSmall,
                    { backgroundColor: selectedColor.hex },
                    isLightColor(selectedColor.hex) && styles.lightColorBorder,
                  ]}
                />
                <Text style={styles.selectText}>
                  {getColorLabel(selectedColor.i18nKey)}
                </Text>
              </View>
            ) : (
              <Text style={[styles.selectText, styles.placeholderText]}>
                {placeholder}
              </Text>
            )}
          </View>
          <ChevronDown size={20} color={Colors.charcoal} />
        </TouchableOpacity>
      </View>

      {error && (
        <View
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCancel}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.closeButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              accessibilityHint="Close selection without changing"
            >
              <X size={24} color={Colors.charcoal} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.optionsList}>
            {COLOR_FAMILIES.map((color) => {
              const isSelected = color.code === value;
              const colorLabel = getColorLabel(color.i18nKey);
              return (
                <Pressable
                  key={color.code}
                  style={({ pressed }) => [
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                    pressed && styles.optionItemPressed,
                  ]}
                  onPress={() => handleSelect(color.code)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={colorLabel}
                  accessibilityHint={isSelected ? 'Currently selected' : 'Double tap to select'}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionLeft}>
                      <View
                        style={[
                          styles.colorSwatchLarge,
                          { backgroundColor: color.hex },
                          isLightColor(color.hex) && styles.lightColorBorder,
                        ]}
                      />
                      <Text style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}>
                        {colorLabel}
                      </Text>
                    </View>
                    {isSelected && (
                      <Check size={24} color={Colors.white} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  selectContainer: {
    position: 'relative',
  },
  label: {
    position: 'absolute' as const,
    left: 16,
    top: 21,
    color: Colors.warmGray,
    fontWeight: '500' as const,
    fontSize: 17,
    letterSpacing: 0.2,
    zIndex: 1,
    backgroundColor: 'transparent',
    pointerEvents: 'none' as const,
  },
  labelFloating: {
    top: 12,
    fontSize: 12,
    color: Colors.warmGray,
  },
  required: {
    color: Colors.error,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 12,
    minHeight: 64,
  },
  selectButtonError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  selectContent: {
    flex: 1,
    justifyContent: 'center',
  },
  selectedValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorSwatchSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorSwatchLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  lightColorBorder: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectText: {
    color: Colors.charcoal,
    fontSize: 17,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  placeholderText: {
    color: Colors.warmGray,
    fontWeight: '400' as const,
  },
  errorText: {
    ...Typography.caption2,
    color: Colors.error,
    marginTop: 6,
    fontSize: 11,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 18,
  },
  closeButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    flex: 1,
  },
  optionItem: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 60,
  },
  optionItemSelected: {
    backgroundColor: Colors.sage,
  },
  optionItemPressed: {
    backgroundColor: Colors.beige,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 60,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  optionLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  optionLabelSelected: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
});
