/**
 * Pixel Density Normalization Utilities
 *
 * Following Expo and React Native best practices for consistent cross-platform rendering.
 * See: https://docs.expo.dev/versions/latest/sdk/captureRef/#note-on-pixel-values
 *
 * Different devices have different pixel densities:
 * - iPhone 13 Pro: ~3x pixel ratio (458 PPI)
 * - Google Pixel 9: ~2.6x pixel ratio (422 PPI)
 * - Samsung A13: ~2x pixel ratio (270 PPI)
 *
 * This module ensures UI elements appear visually consistent across all densities.
 */

import { PixelRatio, Platform } from 'react-native';
import Colors from './colors';

// Get device pixel ratio once (cached for performance)
const pixelRatio = PixelRatio.get();

/**
 * Normalize border width for consistent appearance across pixel densities.
 *
 * Higher density screens need thinner borders in logical pixels to appear the same.
 *
 * @param size - The desired border width in logical pixels
 * @returns Normalized border width
 *
 * @example
 * borderWidth: normalizeBorder(0.5) // Adjusted for visual consistency
 *
 * Tuned based on real device testing:
 * - iPhone (3x): 0.5 → 0.75px (visible but not too thick with 4x opacity)
 * - Pixel (2.6x): 0.5 → 0.375px (perfect)
 * - Samsung (2x): 0.5 → 0.4px (good)
 */
export const normalizeBorder = (size: number): number => {
  if (pixelRatio >= 3) return size * 1.5; // iPhone 13 Pro - visible with 4x opacity
  if (pixelRatio >= 2.5) return size * 0.75; // Google Pixel 9 (stays the same)
  if (pixelRatio >= 2) return size * 0.8; // Samsung A13 (good)
  return size; // Lower density devices
};

/**
 * Normalize shadow/elevation for consistent appearance across platforms.
 *
 * iOS devices with higher pixel ratios need slightly more shadow opacity for visibility.
 * Android elevation is adjusted based on pixel density.
 *
 * @returns Platform-specific shadow configuration object
 *
 * @example
 * ...Platform.select({
 *   ...normalizeShadow(),
 *   default: {},
 * })
 */
export const normalizeShadow = (): { ios: object; android: object } => {
  // iOS devices with higher pixel ratios need MORE shadow opacity for visibility
  // Fixed: removed overflow:'hidden' from parent container so shadows render properly
  // Now using subtle but visible settings
  const shadowOpacity = pixelRatio >= 3 ? 0.12 : 0.06;
  const shadowOffsetHeight = pixelRatio >= 3 ? 3 : 2;
  const shadowRadius = pixelRatio >= 3 ? 10 : 8;

  return {
    ios: {
      shadowColor: Colors.charcoal,
      shadowOffset: { width: 0, height: shadowOffsetHeight },
      shadowOpacity,
      shadowRadius,
    },
    android: {
      elevation: pixelRatio >= 3 ? 2 : 1,
    },
  };
};

/**
 * Normalize shadow with custom parameters.
 *
 * @param options - Custom shadow configuration
 * @returns Platform-specific shadow configuration
 *
 * @example
 * ...Platform.select({
 *   ...normalizeCustomShadow({
 *     color: Colors.black,
 *     baseOpacity: 0.1,
 *     radius: 4
 *   }),
 *   default: {},
 * })
 */
export const normalizeCustomShadow = (options: {
  color?: string;
  baseOpacity?: number;
  radius?: number;
  offsetHeight?: number;
  baseElevation?: number;
}): { ios: object; android: object } => {
  const {
    color = Colors.charcoal,
    baseOpacity = 0.06,
    radius = 8,
    offsetHeight = 2,
    baseElevation = 1,
  } = options;

  // Adjust opacity for high-density screens - 2x now that overflow:hidden is fixed
  const shadowOpacity = pixelRatio >= 3 ? baseOpacity * 2 : baseOpacity;

  return {
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetHeight },
      shadowOpacity,
      shadowRadius: radius,
    },
    android: {
      elevation: pixelRatio >= 3 ? baseElevation * 1.5 : baseElevation,
    },
  };
};

/**
 * Normalize font size for accessibility and consistent rendering.
 *
 * Note: React Native already handles font scaling with fontScale,
 * but this can be used for specific adjustments if needed.
 *
 * @param size - Font size in logical pixels
 * @returns Normalized font size
 */
export const normalizeFontSize = (size: number): number => {
  // React Native handles this automatically via fontScale
  // This function is provided for future extensions
  return size;
};

/**
 * Get the current pixel ratio of the device.
 *
 * @returns The pixel ratio (1x, 2x, 3x, etc.)
 */
export const getPixelRatio = (): number => {
  return pixelRatio;
};

/**
 * Check if device has high pixel density (3x or higher).
 *
 * @returns True if device has 3x or higher pixel ratio
 */
export const isHighDensity = (): boolean => {
  return pixelRatio >= 3;
};

/**
 * Check if device has medium pixel density (2x to 3x).
 *
 * @returns True if device has 2x to 3x pixel ratio
 */
export const isMediumDensity = (): boolean => {
  return pixelRatio >= 2 && pixelRatio < 3;
};

/**
 * Normalize border/shadow color opacity for high-density screens.
 *
 * On high-density displays like iPhone (3x), subtle opacity values (0.04, 0.05)
 * become nearly invisible. This function increases opacity for visibility.
 *
 * @param baseOpacity - The base opacity value (0.0 to 1.0)
 * @returns Normalized opacity value
 *
 * @example
 * // Border color
 * borderColor: `rgba(0, 0, 0, ${normalizeBorderOpacity(0.04)})` // 0.04 on Pixel, 0.16 on iPhone
 *
 * // Shadow opacity
 * shadowOpacity: normalizeBorderOpacity(0.04) // 0.04 on Pixel, 0.16 on iPhone
 */
export const normalizeBorderOpacity = (baseOpacity: number): number => {
  if (pixelRatio >= 3) return Math.min(baseOpacity * 4, 1.0); // iPhone: 4x opacity (max 1.0)
  return baseOpacity; // Other devices: unchanged
};

/**
 * Normalize spacing (padding, margin) based on pixel density.
 *
 * Very small spacing values may need adjustment on high-density screens.
 *
 * @param size - Spacing value in logical pixels
 * @returns Normalized spacing value
 */
export const normalizeSpacing = (size: number): number => {
  // Only adjust very small spacing values
  if (size <= 2 && pixelRatio >= 3) {
    return size * 0.75;
  }
  return size;
};

/**
 * Platform-specific card shadow preset (subtle).
 * Commonly used for card components throughout the app.
 *
 * @example
 * ...Platform.select({
 *   ...cardShadow,
 *   default: {},
 * })
 */
export const cardShadow = normalizeShadow();

/**
 * Platform-specific modal shadow preset (more prominent).
 * Used for elevated modals and dialogs.
 *
 * @example
 * ...Platform.select({
 *   ...modalShadow,
 *   default: {},
 * })
 */
export const modalShadow = normalizeCustomShadow({
  baseOpacity: 0.15,
  radius: 16,
  offsetHeight: 4,
  baseElevation: 4,
});

/**
 * Platform-specific button shadow preset.
 * Used for floating action buttons and prominent CTAs.
 *
 * @example
 * ...Platform.select({
 *   ...buttonShadow,
 *   default: {},
 * })
 */
export const buttonShadow = normalizeCustomShadow({
  baseOpacity: 0.12,
  radius: 12,
  offsetHeight: 3,
  baseElevation: 3,
});
