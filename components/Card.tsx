import React from 'react';
import { View, StyleSheet, ViewProps, Platform } from 'react-native';
import Colors from '@/constants/colors';
import { normalizeBorder, cardShadow, normalizeBorderOpacity } from '@/constants/pixelRatio';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'elevated',
  style,
  ...props 
}) => {
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
};

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