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
import { Image } from 'expo-image';
import { ChevronDown, X, Check } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface MultiSelectOption<T = string> {
  value: T;
  label: string;
  subtitle?: string;
  image?: string;
}

interface MultiSelectProps<T = string> {
  label: string;
  values: T[];
  options: MultiSelectOption<T>[];
  onChange: (values: T[]) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  emptyMessage?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
}

export function MultiSelect<T extends string = string>({
  label,
  values,
  options,
  onChange,
  placeholder = 'Select items',
  required = false,
  error,
  emptyMessage = 'No items available',
  onAddNew,
  addNewLabel = 'Add to Inventory',
}: MultiSelectProps<T>) {
  const [showModal, setShowModal] = useState(false);
  const [selectedValues, setSelectedValues] = useState<T[]>(values);

  const selectedOptions = options.filter((opt) => values.includes(opt.value));
  const displayValue =
    selectedOptions.length > 0
      ? `${selectedOptions.length} selected`
      : placeholder;

  const handlePress = () => {
    setSelectedValues(values);
    setShowModal(true);
  };

  const toggleValue = (value: T) => {
    setSelectedValues((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleDone = () => {
    onChange(selectedValues);
    setShowModal(false);
  };

  const handleCancel = () => {
    setSelectedValues(values);
    setShowModal(false);
  };

  const removeValue = (value: T) => {
    onChange(values.filter((v) => v !== value));
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
        onPress={handlePress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${selectedOptions.length > 0 ? `${selectedOptions.length} items selected` : 'No items selected'}`}
        accessibilityHint="Double tap to change selection"
      >
        <Text
          style={[
            styles.selectText,
            selectedOptions.length === 0 && styles.placeholderText,
          ]}
        >
          {displayValue}
        </Text>
        <ChevronDown size={20} color={Colors.charcoal} />
      </TouchableOpacity>

      {selectedOptions.length > 0 && (
        <View style={styles.selectedItems}>
          {selectedOptions.map((option) => (
            <View key={option.value} style={styles.selectedItem}>
              <Text style={styles.selectedItemText} numberOfLines={1}>
                {option.label}
              </Text>
              <TouchableOpacity
                onPress={() => removeValue(option.value)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${option.label}`}
              >
                <X size={16} color={Colors.charcoal} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

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
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.modalButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity
              onPress={handleDone}
              style={styles.modalButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {options.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{emptyMessage}</Text>
                {onAddNew && (
                  <TouchableOpacity
                    style={styles.addNewButton}
                    onPress={() => {
                      setShowModal(false);
                      onAddNew();
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={addNewLabel}
                  >
                    <Text style={styles.addNewButtonText}>+ {addNewLabel}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && styles.optionPressed,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => toggleValue(option.value)}
                    accessible={true}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={option.label}
                  >
                    <View style={styles.optionContent}>
                      {option.image && (
                        <Image
                          source={{ uri: option.image }}
                          style={styles.optionImage}
                          contentFit="cover"
                          transition={200}
                        />
                      )}
                      <View style={styles.optionText}>
                        <Text style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected
                        ]}>
                          {option.label}
                        </Text>
                        {option.subtitle && (
                          <Text style={[
                            styles.optionSubtitle,
                            isSelected && styles.optionSubtitleSelected
                          ]}>
                            {option.subtitle}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Check size={24} color={Colors.white} strokeWidth={3} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
                {onAddNew && (
                  <TouchableOpacity
                    style={styles.addNewButtonInList}
                    onPress={() => {
                      setShowModal(false);
                      onAddNew();
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={addNewLabel}
                  >
                    <Text style={styles.addNewButtonInListText}>+ {addNewLabel}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '500' as const,
    fontSize: 16,
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
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  selectButtonError: {
    borderColor: Colors.error,
  },
  selectText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
    color: Colors.warmGray,
  },
  selectedItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sage,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  selectedItemText: {
    ...Typography.body,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 4,
    fontSize: 13,
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalButton: {
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 16,
  },
  doneButtonText: {
    ...Typography.body,
    color: Colors.sage,
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  modalTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '600' as const,
  },
  modalContent: {
    flex: 1,
  },
  option: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 60,
  },
  optionPressed: {
    backgroundColor: Colors.beige,
  },
  optionSelected: {
    backgroundColor: Colors.sage,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  optionImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: Colors.beige,
  },
  optionText: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 16,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  optionSubtitle: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 13,
  },
  optionSubtitleSelected: {
    color: Colors.white,
    opacity: 0.9,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.warmGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  addNewButton: {
    backgroundColor: Colors.sage,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  addNewButtonInList: {
    backgroundColor: Colors.white,
    borderTopWidth: 2,
    borderTopColor: Colors.sage,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewButtonInListText: {
    ...Typography.body,
    color: Colors.sage,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
