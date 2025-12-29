import { useState } from 'react';
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
import { YARN_WEIGHTS, getWeightByName } from '@/constants/yarnWeights';
import { useLanguage } from '@/providers/LanguageProvider';

interface WeightCategorySelectProps {
  label: string;
  value?: string;
  onChange: (name: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function WeightCategorySelect({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
}: WeightCategorySelectProps) {
  const [showModal, setShowModal] = useState(false);
  const { t } = useLanguage();

  // Use simple "Select…" placeholder if not provided
  const displayPlaceholder = placeholder || `${t('common.select')}…`;

  const selectedWeight = value ? getWeightByName(value) : undefined;
  const hasValue = !!selectedWeight;

  const handleSelect = (name: string) => {
    onChange(name);
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  // Get translated label for a weight
  const getWeightLabel = (i18nKey: string): string => {
    return t(i18nKey) || i18nKey.split('.').pop() || '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.fieldLabelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      <View style={styles.selectContainer}>
        <TouchableOpacity
          style={[
            styles.selectButton,
            error && styles.selectButtonError,
          ]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${label}. ${selectedWeight ? `Selected: ${getWeightLabel(selectedWeight.i18nKey)}` : displayPlaceholder}`}
          accessibilityHint="Double tap to change selection"
          accessibilityState={{ disabled: false }}
        >
          <View style={styles.selectContent}>
            {hasValue && selectedWeight ? (
              <View style={styles.selectedValueRow}>
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>{selectedWeight.weight}</Text>
                </View>
                <Text style={styles.selectText}>
                  {getWeightLabel(selectedWeight.i18nKey)}
                </Text>
                {selectedWeight.ply && (
                  <Text style={styles.plyText}>({selectedWeight.ply})</Text>
                )}
              </View>
            ) : (
              <Text style={[styles.selectText, styles.placeholderText]}>
                {displayPlaceholder}
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
        presentationStyle="pageSheet"
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
            {YARN_WEIGHTS.map((weight) => {
              const isSelected = weight.name === value;
              const weightLabel = getWeightLabel(weight.i18nKey);
              return (
                <Pressable
                  key={weight.name}
                  style={({ pressed }) => [
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                    pressed && styles.optionItemPressed,
                  ]}
                  onPress={() => handleSelect(weight.name)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${weightLabel}${weight.ply ? ` (${weight.ply})` : ''}`}
                  accessibilityHint={isSelected ? 'Currently selected' : 'Double tap to select'}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionLeft}>
                      <View style={[
                        styles.weightBadge,
                        isSelected && styles.weightBadgeSelected,
                      ]}>
                        <Text style={[
                          styles.weightNumber,
                          isSelected && styles.weightNumberSelected,
                        ]}>
                          {weight.weight}
                        </Text>
                      </View>
                      <View style={styles.labelContainer}>
                        <View style={styles.labelRow}>
                          <Text style={[
                            styles.optionLabel,
                            isSelected && styles.optionLabelSelected,
                          ]}>
                            {weightLabel}
                          </Text>
                          {weight.ply && (
                            <Text style={[
                              styles.plyLabel,
                              isSelected && styles.plyLabelSelected,
                            ]}>
                              ({weight.ply})
                            </Text>
                          )}
                        </View>
                        <Text style={[
                          styles.descLabel,
                          isSelected && styles.descLabelSelected,
                        ]}>
                          {t(weight.descKey)}
                        </Text>
                      </View>
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
  fieldLabelContainer: {
    marginBottom: 8,
  },
  label: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '500' as const,
    fontSize: 14,
  },
  required: {
    color: Colors.error,
  },
  selectContainer: {},
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
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
    gap: 8,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  selectText: {
    color: Colors.charcoal,
    fontSize: 17,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  plyText: {
    color: Colors.warmGray,
    fontSize: 14,
    fontWeight: '400' as const,
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
    gap: 8,
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
  plyLabel: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 13,
  },
  plyLabelSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  weightBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  weightNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.charcoal,
  },
  weightNumberSelected: {
    color: Colors.white,
  },
  labelContainer: {
    flex: 1,
    gap: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  descLabel: {
    fontSize: 13,
    color: Colors.warmGray,
    marginTop: 2,
  },
  descLabelSelected: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
});
