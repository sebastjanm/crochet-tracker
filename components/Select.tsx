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
import { ChevronDown, Check, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface SelectOption<T = string> {
  value: T;
  label: string;
  subtitle?: string;
}

interface SelectProps<T = string> {
  label: string;
  value?: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function Select<T extends string = string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  required = false,
  error,
}: SelectProps<T>) {
  const [showModal, setShowModal] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label || placeholder;

  const handleSelect = (selectedValue: T) => {
    onChange(selectedValue);
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.selectButton,
          error && styles.selectButtonError,
        ]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${selectedOption ? `Selected: ${selectedOption.label}` : placeholder}`}
        accessibilityHint="Double tap to change selection"
        accessibilityState={{ disabled: false }}
      >
        <Text style={[
          styles.selectText,
          !selectedOption && styles.placeholderText,
        ]}>
          {displayValue}
        </Text>
        <ChevronDown size={20} color={Colors.charcoal} />
      </TouchableOpacity>

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
        <View style={styles.modalContainer}>
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
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={String(option.value)}
                  style={({ pressed }) => [
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                    pressed && styles.optionItemPressed,
                  ]}
                  onPress={() => handleSelect(option.value)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityHint={isSelected ? 'Currently selected' : 'Double tap to select'}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionTextContainer}>
                      <Text style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}>
                        {option.label}
                      </Text>
                      {option.subtitle && (
                        <Text style={styles.optionSubtitle}>
                          {option.subtitle}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Check size={24} color={Colors.white} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelContainer: {
    marginBottom: 6,
  },
  label: {
    ...Typography.footnote,
    color: Colors.warmGray,
    fontWeight: '400' as const,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: Colors.error,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.sage}26`, // 15% opacity
    paddingHorizontal: 0,
    paddingVertical: 14,
    minHeight: 44,
  },
  selectButtonError: {
    borderBottomColor: Colors.error,
    borderBottomWidth: 2,
  },
  selectText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 17,
    flex: 1,
  },
  placeholderText: {
    color: Colors.warmGray,
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
    paddingVertical: 16,
    minHeight: 60,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 12,
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
  optionSubtitle: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginTop: 4,
    fontSize: 14,
  },
});
