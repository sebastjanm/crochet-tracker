import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/hooks/language-context';

interface DatePickerProps {
  label: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  maxDate?: Date;
  minDate?: Date;
  disabled?: boolean;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  required = false,
  error,
  maxDate = new Date(), // Default: can't select future dates
  minDate,
  disabled = false,
}: DatePickerProps) {
  const { language } = useLanguage();
  const [showPicker, setShowPicker] = useState(false);
  const [animatedLabelSize] = useState(new Animated.Value(value ? 1 : 0));

  const hasValue = !!value;

  useEffect(() => {
    Animated.timing(animatedLabelSize, {
      toValue: hasValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [hasValue]);

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    // EU format (DD.MM.YYYY) for Slovenian, US format (MM/DD/YYYY) for English
    if (language === 'sl') {
      return `${day}.${month}.${year}`;
    }
    return `${month}/${day}/${year}`;
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    } else if (event.type === 'dismissed') {
      // User cancelled on Android
      setShowPicker(false);
    }
  };

  const handlePress = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  const handleClear = () => {
    onChange(undefined);
  };

  const displayValue = value ? formatDate(value) : placeholder;
  const dateAnnouncement = value
    ? `Selected date: ${formatDate(value)}`
    : 'No date selected';

  const labelStyle = {
    fontSize: animatedLabelSize.interpolate({
      inputRange: [0, 1],
      outputRange: [17, 12],
    }),
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.dateRow,
          error && styles.dateRowError,
          disabled && styles.dateRowDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${dateAnnouncement}`}
        accessibilityHint="Double tap to select a date"
        accessibilityState={{
          disabled,
        }}
      >
        <View style={styles.labelContainer}>
          <Animated.Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Animated.Text>
          {value && (
            <Text
              style={[
                styles.dateText,
                disabled && styles.disabledText,
              ]}
            >
              {formatDate(value)}
            </Text>
          )}
        </View>

        <Calendar size={20} color={disabled ? Colors.warmGray : Colors.sage} />
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

      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={maxDate}
          minimumDate={minDate}
          textColor={Colors.charcoal}
          accentColor={Colors.sage}
          // iOS only: modal presentation
          {...(Platform.OS === 'ios' && {
            style: styles.iosPicker,
          })}
        />
      )}

      {/* iOS: Picker shown inline, add Done button */}
      {showPicker && Platform.OS === 'ios' && (
        <View style={styles.iosPickerActions}>
          <TouchableOpacity
            onPress={() => setShowPicker(false)}
            style={styles.doneButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Done selecting date"
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 18,
    minHeight: 64,
  },
  dateRowError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  dateRowDisabled: {
    opacity: 0.5,
  },
  labelContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: Colors.warmGray,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  required: {
    color: Colors.error,
  },
  dateText: {
    color: Colors.charcoal,
    fontSize: 17,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  placeholderText: {
    color: Colors.warmGray,
  },
  disabledText: {
    color: Colors.warmGray,
  },
  clearButton: {
    padding: 4,
  },
  errorText: {
    ...Typography.caption2,
    color: Colors.error,
    marginTop: 6,
    marginLeft: 0,
    fontSize: 11,
  },
  iosPicker: {
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  iosPickerActions: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  doneButton: {
    backgroundColor: Colors.sage,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 16,
  },
});
