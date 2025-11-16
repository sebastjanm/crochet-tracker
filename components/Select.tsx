import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface SelectOption<T = string> {
  value: T;
  label: string;
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
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label || placeholder;

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      // iOS: Use ActionSheet
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...options.map((opt) => opt.label)],
          cancelButtonIndex: 0,
          title: label,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            const selected = options[buttonIndex - 1];
            if (selected) {
              onChange(selected.value);
            }
          }
        }
      );
    } else {
      // Android: Use Alert with buttons
      Alert.alert(
        label,
        undefined,
        [
          ...options.map((opt) => ({
            text: opt.label,
            onPress: () => onChange(opt.value),
          })),
          {
            text: 'Cancel',
            style: 'cancel' as const,
          },
        ],
        { cancelable: true }
      );
    }
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
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 4,
    fontSize: 13,
  },
});
