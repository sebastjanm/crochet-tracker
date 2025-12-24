import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HelpCircle, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface UniversalHeaderProps {
  title: string;
  showBack?: boolean;
  backLabel?: string;
  showHelp?: boolean;
  helpSection?: 'projects' | 'inventory' | 'yarn' | 'hooks' | 'materials' | 'photos';
  onBackPress?: () => void;
  onHelpPress?: () => void;
  rightAction?: React.ReactNode;
}

export function UniversalHeader({
  title,
  showBack = false,
  backLabel,
  showHelp = true,
  helpSection,
  onBackPress,
  onHelpPress,
  rightAction,
}: UniversalHeaderProps) {
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const handleHelp = () => {
    if (onHelpPress) {
      onHelpPress();
    } else if (helpSection) {
      router.push(`/help/faq?section=${helpSection}`);
    } else {
      router.push('/help');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.deepSage} strokeWidth={2.5} />
            {backLabel && (
              <Text style={styles.backLabel}>{backLabel}</Text>
            )}
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.rightSection}>
        {rightAction}
        {showHelp && (
          <TouchableOpacity
            onPress={handleHelp}
            style={styles.helpButton}
            activeOpacity={0.7}
          >
            <HelpCircle size={32} color={Colors.deepSage} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 44,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.linen,
  },
  backLabel: {
    ...Typography.body,
    color: Colors.deepSage,
    fontWeight: '600' as const,
    fontSize: 16,
  },
  title: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 20,
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpButton: {
    padding: 8,
    marginRight: 8,
  },
});