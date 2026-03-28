import { View, StyleSheet, ViewProps, Platform } from 'react-native';
import type { ReactNode } from 'react';
import { Colors } from '@/constants/colors';
import { normalizeBorder, cardShadow, normalizeBorderOpacity } from '@/constants/pixelRatio';

interface CardProps extends ViewProps {
  children: ReactNode;
  variant?: 'elevated' | 'outlined';
}

/**
 * Card - Container component with elevated or outlined variants.
 * Provides consistent styling for content sections.
 */
export function Card({
  children,
  variant = 'elevated',
  style,
  ...props
}: CardProps): React.JSX.Element {
  return (
    <View 
      style={[
        styles.base,
        variant === 'elevated' ? styles.elevated : styles.outlined,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.linen,
    borderRadius: 16,
    padding: 20,
  },
  elevated: {
    borderWidth: normalizeBorder(0.5),
    borderColor: `rgba(139, 154, 123, ${normalizeBorderOpacity(0.12)})`,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  outlined: {
    borderWidth: normalizeBorder(0.5),
    borderColor: `rgba(139, 154, 123, ${normalizeBorderOpacity(0.12)})`,
  },
});