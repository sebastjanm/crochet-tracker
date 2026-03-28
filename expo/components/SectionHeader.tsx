import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface SectionHeaderProps {
  title: string;
  badge?: string;
  isFirst?: boolean;
  collapsible?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function SectionHeader({
  title,
  badge,
  isFirst = false,
  collapsible = false,
  isCollapsed = false,
  onToggle
}: SectionHeaderProps) {
  if (collapsible) {
    return (
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={onToggle}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${title} section`}
        accessibilityHint={isCollapsed ? 'Tap to expand' : 'Tap to collapse'}
        accessibilityState={{ expanded: !isCollapsed }}
      >
        {badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
        <Text style={styles.collapsibleTitle}>{title}</Text>
        {isCollapsed ? (
          <ChevronDown size={20} color={Colors.warmGray} />
        ) : (
          <ChevronUp size={20} color={Colors.warmGray} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.header, isFirst && styles.headerFirst]}>
      {badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 0,
    marginBottom: 8,
  },
  headerFirst: {
    marginTop: 0,
  },
  title: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    lineHeight: 16,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: `${Colors.sage}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.sage,
    lineHeight: 16,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    marginTop: 24,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  collapsibleTitle: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    lineHeight: 16,
    flex: 1,
  },
});
