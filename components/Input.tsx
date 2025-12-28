import { useState, useEffect } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { MAX_FONT_SIZE_MULTIPLIER, ACCESSIBLE_COLORS } from '@/constants/accessibility';
import { useLanguage } from '@/hooks/language-context';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
}

/**
 * Input - Floating label text input with validation and accessibility.
 * Supports password visibility toggle and error states.
 */
export function Input({
  label,
  error,
  helper,
  required = false,
  style,
  accessibilityLabel,
  value,
  multiline,
  secureTextEntry,
  ...props
}: InputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);
  const [animatedLabelPosition] = useState(new Animated.Value(value ? 1 : 0));
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();

  const isPasswordField = secureTextEntry === true;

  const hasValue = value && value.length > 0;
  const shouldFloat = isFocused || hasValue;

  useEffect(() => {
    Animated.timing(animatedLabelPosition, {
      toValue: shouldFloat ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [shouldFloat]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 16,
    top: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [21, 12],
    }),
    fontSize: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [17, 12],
    }),
    color: isFocused ? Colors.sage : Colors.warmGray,
    zIndex: 1,
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {label && (
          <Animated.Text
            style={[styles.label, labelStyle]}
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          >
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Animated.Text>
        )}
        <TextInput
          style={[
            styles.input,
            shouldFloat && styles.inputWithFloatingLabel,
            shouldFloat && multiline && styles.inputMultilineWithFloatingLabel,
            error && styles.inputError,
            isPasswordField && styles.inputWithIcon,
            style,
          ]}
          placeholderTextColor="transparent"
          accessible={true}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={error ? `Error: ${error}` : helper}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={value}
          multiline={multiline}
          secureTextEntry={isPasswordField && !showPassword}
          {...props}
        />
        {isPasswordField && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={20} color={Colors.warmGray} />
            ) : (
              <Eye size={20} color={Colors.warmGray} />
            )}
          </TouchableOpacity>
        )}
      </View>
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
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputContainer: {
    position: 'relative',
  },
  label: {
    fontWeight: '500',
    letterSpacing: 0.2,
    backgroundColor: 'transparent',
    pointerEvents: 'none' as const,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 12,
    minHeight: 64,
    color: Colors.charcoal,
    fontWeight: '500',
    fontSize: 17,
    lineHeight: 20,
  },
  inputWithFloatingLabel: {
    paddingTop: 32,
    paddingBottom: 12,
  },
  inputMultilineWithFloatingLabel: {
    paddingTop: 32,
    paddingBottom: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  inputError: {
    borderColor: ACCESSIBLE_COLORS.errorAccessible,
    borderWidth: 2,
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
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