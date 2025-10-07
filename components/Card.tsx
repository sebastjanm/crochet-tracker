import React from 'react';
import { View, StyleSheet, ViewProps, Platform } from 'react-native';
import Colors from '@/constants/colors';

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
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
});