import { Platform } from 'react-native';

export const Typography = {
  // Display - Hero sections (Swiss elegance)
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '300' as const,      // Light for luxury
    letterSpacing: -0.6,
  },

  // Titles - Refined hierarchy
  largeTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400' as const,      // Regular, not bold
    letterSpacing: -0.4,
  },
  title1: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400' as const,
    letterSpacing: -0.3,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500' as const,      // Medium
    letterSpacing: -0.3,
  },
  title3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500' as const,
    letterSpacing: -0.2,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '500' as const,
  },

  // Body - Reading comfort (1.5+ line height for warmth)
  body: {
    fontSize: 17,
    lineHeight: 26,                   // 1.53 ratio for comfort
    fontWeight: '400' as const,
    letterSpacing: -0.1,
  },
  bodyLarge: {
    fontSize: 19,
    lineHeight: 28,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
  },
  bodySmall: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },

  // Labels - Form elements
  callout: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },

  // Captions - Metadata (warm gray tones)
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
  },

  // Interactive elements
  button: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '500' as const,      // Medium, not bold
    letterSpacing: -0.1,
  },

  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
};