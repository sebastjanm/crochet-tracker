import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Lock } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface LockedProFeatureProps {
  title: string;
  description?: string;
  onUpgradePress?: () => void;
}

export function LockedProFeature({
  title,
  description = "This feature is available to Pro subscribers.",
  onUpgradePress
}: LockedProFeatureProps) {
  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      // Navigate to subscription/paywall screen (to be implemented)
      // router.push('/subscription');
      if (__DEV__) console.log('Navigate to subscription screen');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Lock size={48} color={Colors.sage} strokeWidth={1.5} />
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Pro Feature</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <Button
          title="Upgrade to Pro"
          onPress={handleUpgrade}
          size="large"
          style={styles.upgradeButton}
          accessible={true}
          accessibilityLabel="Upgrade to Pro subscription"
          accessibilityHint="Unlock this feature with a Pro subscription"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.cream,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    backgroundColor: Colors.linen,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(139, 154, 123, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#2D2D2D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(139, 154, 123, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: Colors.sage,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 20,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontWeight: '500' as const,
    fontSize: 22,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  upgradeButton: {
    minWidth: 200,
  },
});
