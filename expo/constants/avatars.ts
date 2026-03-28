

export interface AvatarStyle {
  backgroundColor: string;
  emoji: string;
  name: string;
}

export const CUTE_AVATARS: AvatarStyle[] = [
  { backgroundColor: '#FFB6C1', emoji: '🐱', name: 'Kitty' },
  { backgroundColor: '#98FB98', emoji: '🐸', name: 'Froggy' },
  { backgroundColor: '#87CEEB', emoji: '🐧', name: 'Penguin' },
  { backgroundColor: '#DDA0DD', emoji: '🦄', name: 'Unicorn' },
  { backgroundColor: '#F0E68C', emoji: '🐥', name: 'Chick' },
  { backgroundColor: '#FFA07A', emoji: '🦊', name: 'Fox' },
  { backgroundColor: '#20B2AA', emoji: '🐨', name: 'Koala' },
  { backgroundColor: '#9370DB', emoji: '🐙', name: 'Octopus' },
  { backgroundColor: '#32CD32', emoji: '🐢', name: 'Turtle' },
  { backgroundColor: '#FF6347', emoji: '🦀', name: 'Crab' },
  { backgroundColor: '#4169E1', emoji: '🐳', name: 'Whale' },
  { backgroundColor: '#FFD700', emoji: '🐝', name: 'Bee' },
  { backgroundColor: '#FF1493', emoji: '🦩', name: 'Flamingo' },
  { backgroundColor: '#00CED1', emoji: '🐬', name: 'Dolphin' },
  { backgroundColor: '#DA70D6', emoji: '🦋', name: 'Butterfly' },
  { backgroundColor: '#228B22', emoji: '🐛', name: 'Bug' },
  { backgroundColor: '#FF4500', emoji: '🦁', name: 'Lion' },
  { backgroundColor: '#8A2BE2', emoji: '🐻', name: 'Bear' },
  { backgroundColor: '#00FF7F', emoji: '🐰', name: 'Bunny' },
];

// Generate a consistent avatar based on user email or name
export function getUserAvatar(identifier: string): AvatarStyle {
  if (!identifier) {
    return CUTE_AVATARS[0]; // Default to first avatar
  }
  
  // Create a simple hash from the identifier
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get a consistent index
  const index = Math.abs(hash) % CUTE_AVATARS.length;
  return CUTE_AVATARS[index];
}

// Get initials as fallback
export function getInitials(name?: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}