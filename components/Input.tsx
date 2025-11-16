import React from 'react';
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
  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={styles.label}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
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
        accessibilityHint={error ? `Error: ${error}` : helper}
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        {...props}
      />
      {helper && !error && (
        <Text
          style={styles.helper}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
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
    marginBottom: 20,
  },
  label: {
    ...Typography.footnote,
    color: Colors.warmGray,
    marginBottom: 6,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    ...Typography.body,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.sage}26`, // 15% opacity
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 14,
    minHeight: 44,
    color: Colors.charcoal,
  },
  inputError: {
    borderBottomColor: ACCESSIBLE_COLORS.errorAccessible,
    borderBottomWidth: 2,
  },
  helper: {
    ...Typography.caption2,
    color: Colors.warmGray,
    marginTop: 6,
  },
  error: {
    ...Typography.caption2,
    color: ACCESSIBLE_COLORS.errorAccessible,
    marginTop: 6,
    fontWeight: '400',
  },
  required: {
    color: ACCESSIBLE_COLORS.errorAccessible,
  },
});