import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    ...Typography.title2,
    color: Colors.charcoal,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    ...Typography.body,
    color: Colors.warmGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  action: {
    marginTop: 16,
  },
});