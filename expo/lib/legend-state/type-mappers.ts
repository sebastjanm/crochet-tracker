/**
 * Image Helpers for Legend-State Sync
 *
 * Helper functions for handling local vs cloud image URIs.
 * Used by the image upload queue to detect and replace local file:// URIs
 * with cloud https:// URLs after upload.
 */

// ============================================================================
// IMAGE HELPERS
// ============================================================================

/**
 * Check if a URI is a local file path (needs upload)
 */
export function isLocalImageUri(uri: string): boolean {
  return typeof uri === 'string' && uri.startsWith('file://');
}

/**
 * Check if a URI is a secure cloud URL (already uploaded)
 * Only HTTPS is accepted for security compliance with App Store/Play Store requirements
 */
export function isCloudImageUrl(uri: string): boolean {
  return typeof uri === 'string' && uri.startsWith('https://');
}

/**
 * Upgrade HTTP URLs to HTTPS for security compliance.
 * Returns the original URL if already HTTPS or not a valid HTTP URL.
 */
export function ensureHttpsUrl(uri: string): string {
  if (typeof uri === 'string' && uri.startsWith('http://')) {
    return uri.replace('http://', 'https://');
  }
  return uri;
}

/**
 * Filter out local file:// URIs from an images array.
 * Returns only cloud URLs that can be synced to Supabase.
 */
export function filterLocalImages(images: (string | unknown)[]): string[] {
  return images
    .filter((img): img is string => typeof img === 'string')
    .filter(uri => !isLocalImageUri(uri));
}

/**
 * Get local images that need to be uploaded.
 * Returns array of { uri, index } for queue processing.
 */
export function getLocalImagesToUpload(
  images: (string | unknown)[]
): Array<{ uri: string; index: number }> {
  return images
    .map((img, index) => ({ img, index }))
    .filter((item): item is { img: string; index: number } =>
      typeof item.img === 'string' && isLocalImageUri(item.img)
    )
    .map(({ img, index }) => ({ uri: img, index }));
}

/**
 * Replace a local URI with a cloud URL in an images array.
 * Returns a new array with the replacement made.
 */
export function replaceImageUri(
  images: (string | unknown)[],
  oldUri: string,
  newUrl: string
): string[] {
  return images.map(img => {
    if (typeof img === 'string' && img === oldUri) {
      return newUrl;
    }
    return typeof img === 'string' ? img : String(img);
  });
}
