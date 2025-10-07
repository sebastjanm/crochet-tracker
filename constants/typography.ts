import { Platform } from 'react-native';

export const Typography = {
  // Large, accessible font sizes for older users
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600' as const,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '600' as const,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyLarge: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
};