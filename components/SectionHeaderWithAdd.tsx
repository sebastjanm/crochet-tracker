import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface SectionHeaderWithAddProps {
  title: string;
  onAdd: () => void;
  addButtonLabel: string;
}

export function SectionHeaderWithAdd({ title, onAdd, addButtonLabel }: SectionHeaderWithAddProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity
        style={styles.sectionAddButton}
        onPress={onAdd}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={addButtonLabel}
      >
        <Plus size={20} color={Colors.sage} />
        <Text style={styles.sectionAddButtonText}>{addButtonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 18,
  },
  sectionAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.beige,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  sectionAddButtonText: {
    ...Typography.body,
    color: Colors.sage,
    fontWeight: '600' as const,
    fontSize: 15,
  },
});
