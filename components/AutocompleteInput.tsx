/**
 * AutocompleteInput Component
 *
 * A text input with dropdown suggestions for autocomplete functionality.
 * Used for yarn brand suggestions and other learnable inputs.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Pressable,
  Keyboard,
  Platform,
} from 'react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { MAX_FONT_SIZE_MULTIPLIER, ACCESSIBLE_COLORS } from '@/constants/accessibility';

interface AutocompleteInputProps extends Omit<TextInputProps, 'onChangeText'> {
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  getSuggestions: (query: string) => Promise<string[]>;
  onBlur?: () => void;
  onFocus?: () => void;
}

const DEBOUNCE_MS = 150;

export function AutocompleteInput({
  label,
  error,
  helper,
  required = false,
  value,
  onChangeText,
  getSuggestions,
  onBlur,
  onFocus,
  style,
  accessibilityLabel,
  ...props
}: AutocompleteInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [animatedLabelPosition] = useState(new Animated.Value(value ? 1 : 0));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const hasValue = value && value.length > 0;
  const shouldFloat = isFocused || hasValue;

  // Animate floating label
  useEffect(() => {
    Animated.timing(animatedLabelPosition, {
      toValue: shouldFloat ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [shouldFloat, animatedLabelPosition]);

  // Debounced suggestion fetching
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query || query.trim().length === 0) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      try {
        const results = await getSuggestions(query);
        setSuggestions(results);
        setShowDropdown(results.length > 0 && isFocused);
      } catch (error) {
        if (__DEV__) console.error('[AutocompleteInput] Error fetching suggestions:', error);
        setSuggestions([]);
        setShowDropdown(false);
      }
    },
    [getSuggestions, isFocused]
  );

  // Handle text change with debounce
  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce the suggestion fetch
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(text);
      }, DEBOUNCE_MS);
    },
    [onChangeText, fetchSuggestions]
  );

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      onChangeText(suggestion);
      setSuggestions([]);
      setShowDropdown(false);
      Keyboard.dismiss();
    },
    [onChangeText]
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
    onFocus?.();
  }, [suggestions.length, onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding dropdown to allow tap on suggestion
    setTimeout(() => {
      setShowDropdown(false);
    }, 150);
    onBlur?.();
  }, [onBlur]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

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
          ref={inputRef}
          style={[
            styles.input,
            shouldFloat && styles.inputWithFloatingLabel,
            error && styles.inputError,
            style,
          ]}
          placeholderTextColor="transparent"
          accessible={true}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={error ? `Error: ${error}` : helper}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          onChangeText={handleChangeText}
          autoCorrect={false}
          autoCapitalize="words"
          {...props}
        />

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <View style={styles.dropdown}>
            {suggestions.map((suggestion, index) => (
              <Pressable
                key={suggestion}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  index === 0 && styles.suggestionItemFirst,
                  pressed && styles.suggestionItemPressed,
                ]}
                onPress={() => handleSelectSuggestion(suggestion)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={suggestion}
                accessibilityHint="Double tap to select this brand"
              >
                <View style={styles.suggestionContent}>
                  {index === 0 && <View style={styles.highlightBar} />}
                  <Text
                    style={[
                      styles.suggestionText,
                      index === 0 && styles.suggestionTextFirst,
                    ]}
                    numberOfLines={1}
                    maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                  >
                    {suggestion}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
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
    zIndex: 10, // Ensure dropdown appears above other elements
  },
  inputContainer: {
    position: 'relative',
    zIndex: 10,
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
  inputError: {
    borderColor: ACCESSIBLE_COLORS.errorAccessible,
    borderWidth: 2,
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    zIndex: 100,
  },
  suggestionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    minHeight: 48,
    justifyContent: 'center',
  },
  suggestionItemFirst: {
    backgroundColor: Colors.cream,
  },
  suggestionItemPressed: {
    backgroundColor: Colors.beige,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightBar: {
    width: 3,
    height: 20,
    backgroundColor: Colors.sage,
    borderRadius: 2,
    marginRight: 12,
  },
  suggestionText: {
    ...Typography.body,
    color: Colors.charcoal,
    flex: 1,
  },
  suggestionTextFirst: {
    fontWeight: '600',
    color: Colors.deepSage,
  },
});
