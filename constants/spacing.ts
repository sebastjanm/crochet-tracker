/**
 * Swiss-luxury spacing system
 * Based on 8px grid for consistency and precision
 */

export const Spacing = {
  // Base unit
  unit: 8,

  // Component spacing (8px increments)
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Layout spacing
  screenPadding: 24,        // Screen edges (warm, not cramped)
  sectionGap: 56,           // Between major sections (breathing room)
  cardPadding: 24,          // Inside cards (tactile comfort)
  cardGap: 20,              // Between cards (visual rhythm)

  // Interactive elements
  touchTarget: 48,          // Minimum touch size (accessibility)
  buttonPadding: 16,        // Button internal padding
  inputPadding: 16,         // Form input padding

  // Micro-spacing
  iconGap: 10,              // Icon to text
  chipGap: 8,               // Between chips/tags
  lineGap: 12,              // Between lines in lists
};

export default Spacing;
