import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { ProjectType } from '@/types';
import { getProjectTypeConfig } from '@/constants/projectTypes';
import { useLanguage } from '@/providers/LanguageProvider';

interface ProjectTypeBadgeProps {
  type: ProjectType;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function ProjectTypeBadge({
  type,
  size = 'medium',
  showLabel = true,
}: ProjectTypeBadgeProps) {
  const { t } = useLanguage();
  const config = getProjectTypeConfig(type);
  const translatedLabel = t(`projects.projectTypes.${type}`);

  // Get the icon component dynamically
  // eslint-disable-next-line import/namespace
  const IconComponent = LucideIcons[config.icon as keyof typeof LucideIcons] as any;

  const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;
  const badgePadding = size === 'small' ? 6 : size === 'medium' ? 8 : 10;
  const fontSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.color, padding: badgePadding },
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${t('projects.projectType')}: ${translatedLabel}`}
    >
      {IconComponent && (
        <IconComponent
          size={iconSize}
          color={Colors.white}
          strokeWidth={2.5}
        />
      )}

      {showLabel && (
        <Text
          style={[
            styles.label,
            { fontSize },
          ]}
          numberOfLines={1}
        >
          {translatedLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
  },
});
