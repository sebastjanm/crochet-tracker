import React, { useId } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { MAX_FONT_SIZE_MULTIPLIER, ACCESSIBLE_COLORS } from '@/constants/accessibility';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  required = false,
  style,
  accessibilityLabel,
  ...props
}) => {
  const inputId = useId();

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={styles.label}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          nativeID={`${inputId}-label`}
        >
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={Colors.warmGray}
        accessible={true}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityRequired={required}
        accessibilityInvalid={!!error}
        accessibilityLabelledBy={label ? `${inputId}-label` : undefined}
        accessibilityDescribedBy={
          error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined
        }
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        {...props}
      />
      {helper && !error && (
        <Text
          style={styles.helper}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          nativeID={`${inputId}-helper`}
          accessible={false}
        >
          {helper}
        </Text>
      )}
      {error && (
        <View
          accessible={true}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          nativeID={`${inputId}-error`}
        >
          <Text
            style={styles.error}
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            accessible={false}
          >
            {error}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    ...Typography.body,
    color: Colors.charcoal,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    ...Typography.bodyLarge,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
    color: Colors.charcoal,
  },
  inputError: {
    borderColor: Colors.error,
  },
  helper: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginTop: 4,
  },
  error: {
    ...Typography.caption,
    color: ACCESSIBLE_COLORS.errorAccessible,
    marginTop: 4,
    fontWeight: '500',
  },
  required: {
    color: ACCESSIBLE_COLORS.errorAccessible,
  },
});