import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  View,
  Platform,
} from 'react-native';
import type { ReactNode } from 'react';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { MAX_FONT_SIZE_MULTIPLIER } from '@/constants/accessibility';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'large' | 'medium' | 'small';
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Button - Reusable button component with multiple variants and sizes.
 * Supports loading state, icons, and full accessibility.
 */
export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  icon,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  ...props
}: ButtonProps): React.JSX.Element {
  const buttonStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[size],
    ...(fullWidth ? [styles.fullWidth] : []),
    ...(disabled ? [styles.disabled] : []),
    ...(style ? [style as ViewStyle] : []),
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    ...(disabled ? [styles.disabledText] : []),
  ];

  const getLoadingColor = () => {
    if (variant === 'primary') return Colors.white;
    if (variant === 'destructive') return Colors.white;
    return Colors.sage;
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      activeOpacity={disabled ? 1 : 0.75}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={getLoadingColor()}
          size="small"
          accessibilityLabel="Loading"
        />
      ) : (
        <View style={styles.content}>
          {icon && icon}
          <Text
            style={textStyle}
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            accessible={false}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 0,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#2D2D2D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primary: {
    backgroundColor: Colors.deepSage,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  secondary: {
    backgroundColor: Colors.white,
    borderWidth: 2.5,
    borderColor: Colors.sage,
    ...Platform.select({
      ios: {
        shadowColor: Colors.sage,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  ghost: {
    backgroundColor: 'rgba(139, 154, 123, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 154, 123, 0.2)',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
      default: {},
    }),
  },
  destructive: {
    backgroundColor: Colors.error,
    borderColor: '#A85A3F',
    ...Platform.select({
      ios: {
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 56,
    borderRadius: 12,
  },
  medium: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    minHeight: 54,
    borderRadius: 16,
  },
  small: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 46,
    borderRadius: 14,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: Colors.warmGray,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
      default: {},
    }),
  },
  text: {
    ...Typography.button,
    textAlign: 'center',
    letterSpacing: -0.1,
    fontWeight: '700' as const,
  },
  primaryText: {
    color: Colors.white,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  secondaryText: {
    color: Colors.deepSage,
    fontWeight: '700' as const,
  },
  ghostText: {
    color: Colors.sage,
    fontWeight: '600' as const,
  },
  destructiveText: {
    color: Colors.white,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  disabledText: {
    color: Colors.white,
    opacity: 0.8,
  },
  largeText: {
    fontSize: 19,
    fontWeight: '700' as const,
    lineHeight: 24,
  },
  mediumText: {
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 22,
  },
  smallText: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
});