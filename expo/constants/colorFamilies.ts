/**
 * Standardized Color Families for Yarn
 *
 * These IDs are canonical - future colors must continue numbering (19, 20, 21...).
 * Store `code` in the database; use `hex` for UI swatches.
 * Use `i18nKey` for localized display labels.
 */

export interface ColorFamily {
  id: number;
  code: string;
  hex: string;
  i18nKey: string;
}

export const COLOR_FAMILIES: ColorFamily[] = [
  { id: 1,  code: 'black',     hex: '#000000', i18nKey: 'color.black' },
  { id: 2,  code: 'gray',      hex: '#CCCCCC', i18nKey: 'color.gray' },
  { id: 3,  code: 'silver',    hex: '#999999', i18nKey: 'color.silver' },
  { id: 4,  code: 'white',     hex: '#FFFFFF', i18nKey: 'color.white' },
  { id: 5,  code: 'cream',     hex: '#FFFFF2', i18nKey: 'color.cream' },
  { id: 6,  code: 'mint',      hex: '#B2E7DF', i18nKey: 'color.mint' },
  { id: 7,  code: 'turquoise', hex: '#0AFBED', i18nKey: 'color.turquoise' },
  { id: 8,  code: 'blue',      hex: '#0E52C3', i18nKey: 'color.blue' },
  { id: 9,  code: 'purple',    hex: '#7C12D6', i18nKey: 'color.purple' },
  { id: 10, code: 'pink',      hex: '#FF73FA', i18nKey: 'color.pink' },
  { id: 11, code: 'red',       hex: '#FF0000', i18nKey: 'color.red' },
  { id: 12, code: 'burgundy',  hex: '#993333', i18nKey: 'color.burgundy' },
  { id: 13, code: 'orange',    hex: '#FF7301', i18nKey: 'color.orange' },
  { id: 14, code: 'yellow',    hex: '#FFF70F', i18nKey: 'color.yellow' },
  { id: 15, code: 'gold',      hex: '#887711', i18nKey: 'color.gold' },
  { id: 16, code: 'green',     hex: '#159600', i18nKey: 'color.green' },
  { id: 17, code: 'brown',     hex: '#513F29', i18nKey: 'color.brown' },
  { id: 18, code: 'beige',     hex: '#E0CFAD', i18nKey: 'color.beige' },
];

/**
 * Find a color by its code
 */
export function getColorByCode(code: string): ColorFamily | undefined {
  return COLOR_FAMILIES.find((c) => c.code === code);
}

/**
 * Get the hex value for a color code
 */
export function getColorHex(code: string): string | undefined {
  return getColorByCode(code)?.hex;
}

/**
 * Check if a color is light (needs border for visibility)
 */
export function isLightColor(hex: string): boolean {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.8;
}
