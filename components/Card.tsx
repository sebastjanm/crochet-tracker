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
    backgroundColor: Colors.linen,
    borderRadius: 16,
    padding: 20,
  },
  elevated: {
    borderWidth: 0.5,
    borderColor: 'rgba(139, 154, 123, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#2D2D2D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  outlined: {
    borderWidth: 0.5,
    borderColor: 'rgba(139, 154, 123, 0.12)',
  },
});