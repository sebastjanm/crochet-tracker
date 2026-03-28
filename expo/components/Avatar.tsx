import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { getUserAvatar, getInitials, CUTE_AVATARS } from '@/constants/avatars';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface AvatarProps {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  size?: number;
  showEmoji?: boolean;
}

export function Avatar({ user, size = 48, showEmoji = true }: AvatarProps) {
  const identifier = user?.email || user?.name || '';
  const initials = getInitials(user?.name);

  // Check if user has a stored avatar preference
  const storedAvatar = user?.avatar
    ? CUTE_AVATARS.find(a => a.name === user.avatar)
    : null;

  // Use stored avatar if available, otherwise fall back to hash-based
  const avatarStyle = storedAvatar || getUserAvatar(identifier);
  
  const containerSize = size;
  const emojiSize = Math.floor(size * 0.5);
  const iconSize = Math.floor(size * 0.5);
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          width: containerSize, 
          height: containerSize, 
          borderRadius: containerSize / 2,
          backgroundColor: showEmoji ? avatarStyle.backgroundColor : Colors.sage,
        }
      ]}
    >
      {showEmoji && identifier ? (
        <Text style={[styles.emoji, { fontSize: emojiSize }]}>
          {avatarStyle.emoji}
        </Text>
      ) : initials.length > 0 ? (
        <Text style={[styles.initials, { fontSize: Math.floor(size * 0.35) }]}>
          {initials}
        </Text>
      ) : (
        <User size={iconSize} color={Colors.white} strokeWidth={2.5} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
  initials: {
    ...Typography.title3,
    color: Colors.white,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
});