/**
 * Supabase Storage Upload Utility
 *
 * Handles image uploads to Supabase Storage buckets.
 * Uses expo-file-system to read files and expo-blob for proper Blob creation.
 *
 * Flow:
 * 1. Read file as Uint8Array using expo-file-system File.bytes()
 * 2. Create proper Blob using expo-blob
 * 3. Upload Blob to Supabase Storage
 *
 * @see https://docs.expo.dev/versions/latest/sdk/filesystem/
 * @see https://docs.expo.dev/versions/latest/sdk/blob/
 * @see https://supabase.com/docs/guides/storage/uploads/standard-uploads
 */

import { File as ExpoFile } from 'expo-file-system';
import { Blob as ExpoBlob } from 'expo-blob';
import { supabase, isSupabaseConfigured } from './client';

export type StorageBucket = 'project-images' | 'inventory-images' | 'avatars' | 'pattern-pdfs';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadOptions {
  /** Override content type detection */
  contentType?: string;
  /** Overwrite existing file */
  upsert?: boolean;
}

/**
 * Check if a URI is a local file path
 */
export function isLocalFileUri(uri: string): boolean {
  return uri.startsWith('file://');
}

/**
 * Check if a URI is a Supabase Storage URL
 */
export function isSupabaseStorageUrl(uri: string): boolean {
  return uri.includes('supabase.co/storage');
}

/**
 * Get MIME type from file extension
 */
function getMimeType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'heic':
      return 'image/heic';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'image/jpeg'; // Default for images from camera/picker
  }
}

/**
 * Upload a local file to Supabase Storage
 *
 * Uses expo-file-system File class which natively implements Blob.
 * This is the most efficient approach for SDK 54+.
 *
 * @param localUri - Local file:// URI from expo-image-picker or camera
 * @param bucket - Target storage bucket
 * @param userId - User ID for path organization
 * @param itemId - Item ID (project or inventory) for path organization
 * @param options - Upload options
 * @returns Upload result with public URL on success
 *
 * @example
 * ```typescript
 * const result = await uploadImage(
 *   'file:///path/to/image.jpg',
 *   'project-images',
 *   'user-123',
 *   'project-456'
 * );
 *
 * if (result.success) {
 *   console.log('Uploaded to:', result.url);
 * }
 * ```
 */
export async function uploadImage(
  localUri: string,
  bucket: StorageBucket,
  userId: string,
  itemId: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // Validate Supabase is configured
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase is not configured',
    };
  }

  // Validate it's a local file
  if (!isLocalFileUri(localUri)) {
    return {
      success: false,
      error: `Not a local file URI: ${localUri}`,
    };
  }

  try {
    // Create ExpoFile instance from URI - implements Blob interface
    const file = new ExpoFile(localUri);

    // Check file exists
    if (!file.exists) {
      return {
        success: false,
        error: `File does not exist: ${localUri}`,
      };
    }

    console.log(`[Storage] File info:`, {
      uri: localUri.slice(0, 50),
      size: file.size,
      type: file.type,
      exists: file.exists
    });

    // Validate file has content
    if (file.size === 0) {
      return {
        success: false,
        error: 'File is empty (0 bytes)',
      };
    }

    // Generate unique storage path: {userId}/{itemId}/{timestamp}.{ext}
    const extension = file.extension?.replace('.', '') || localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${itemId}/${Date.now()}.${extension}`;

    // Determine content type (prefer file.type if available, fallback to extension-based)
    const contentType = options.contentType || (file.type && file.type !== '' ? file.type : getMimeType(localUri));

    console.log(`[Storage] Uploading to ${bucket}/${fileName} (${contentType}, ${file.size} bytes)`);

    // Step 1: Read file as Uint8Array using expo-file-system
    const bytes = await file.bytes();
    console.log(`[Storage] Read ${bytes.byteLength} bytes from file`);

    if (bytes.byteLength === 0) {
      return {
        success: false,
        error: 'File bytes is empty (0 bytes)',
      };
    }

    // Step 2: Create proper Blob using expo-blob (Expo's web-standards-compliant Blob)
    // @see https://docs.expo.dev/versions/latest/sdk/blob/
    const blob = new ExpoBlob([bytes], { type: contentType });
    console.log(`[Storage] Created ExpoBlob: size=${blob.size}, type=${blob.type}`);

    // Step 3: Upload to Supabase Storage
    // Cast to Blob since Supabase types expect web Blob, but ExpoBlob is compatible
    const { data, error } = await supabase!.storage
      .from(bucket)
      .upload(fileName, blob as unknown as Blob, {
        contentType,
        upsert: options.upsert ?? false,
      });

    if (error) {
      console.error('[Storage] Upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL (buckets are public)
    const { data: urlData } = supabase!.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log(`[Storage] Upload successful: ${urlData.publicUrl}`);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('[Storage] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload multiple images in parallel
 *
 * @param images - Array of { localUri, itemId } pairs
 * @param bucket - Target storage bucket
 * @param userId - User ID for path organization
 * @returns Array of upload results in same order as input
 */
export async function uploadImages(
  images: Array<{ localUri: string; itemId: string }>,
  bucket: StorageBucket,
  userId: string
): Promise<UploadResult[]> {
  const results = await Promise.all(
    images.map(({ localUri, itemId }) =>
      uploadImage(localUri, bucket, userId, itemId)
    )
  );
  return results;
}

/**
 * Delete a file from Supabase Storage
 *
 * @param path - Storage path (not full URL)
 * @param bucket - Storage bucket
 * @returns Success status
 */
export async function deleteImage(
  path: string,
  bucket: StorageBucket
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { error } = await supabase!.storage.from(bucket).remove([path]);

    if (error) {
      console.error('[Storage] Delete error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Storage] Deleted: ${bucket}/${path}`);
    return { success: true };
  } catch (error) {
    console.error('[Storage] Unexpected delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract storage path from a Supabase public URL
 *
 * @param url - Full Supabase storage URL
 * @param bucket - Storage bucket name
 * @returns Storage path or null if not a valid URL
 *
 * @example
 * ```typescript
 * const path = extractPathFromUrl(
 *   'https://xxx.supabase.co/storage/v1/object/public/project-images/user/proj/123.jpg',
 *   'project-images'
 * );
 * // Returns: 'user/proj/123.jpg'
 * ```
 */
export function extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
  const pattern = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
  const match = url.match(pattern);
  return match?.[1] || null;
}
