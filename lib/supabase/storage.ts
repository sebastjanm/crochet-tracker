/**
 * Supabase Storage Upload Utility
 *
 * Handles image uploads to Supabase Storage buckets.
 *
 * SDK 54 Approach:
 * - Reads file as ArrayBuffer/Base64 to ensure content is sent
 * - Passes raw data to Supabase upload
 * - HEIC images are converted to JPEG using expo-image-manipulator
 */

import { File as ExpoFile } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase, isSupabaseConfigured } from './client';
import { decode } from 'base64-arraybuffer';

export type StorageBucket = 'project-images' | 'inventory-images' | 'avatars' | 'pattern-pdfs';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadOptions {
  contentType?: string;
  upsert?: boolean;
}

export function isLocalFileUri(uri: string): boolean {
  return uri.startsWith('file://');
}

export function isSupabaseStorageUrl(uri: string): boolean {
  return uri.includes('supabase.co/storage');
}

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
      return 'image/jpeg';
  }
}

export async function uploadImage(
  localUri: string,
  bucket: StorageBucket,
  userId: string,
  itemId: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  if (__DEV__) console.log('[Storage] uploadImage called', {
    localUri: localUri.substring(0, 60) + '...',
    bucket,
    userId: userId.substring(0, 8) + '...',
    itemId,
  });

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  if (!isLocalFileUri(localUri)) {
    return { success: false, error: `Not a local file URI: ${localUri}` };
  }

  try {
    const file = new ExpoFile(localUri);
    if (!file.exists) {
      return { success: false, error: `File does not exist: ${localUri}` };
    }

    if (file.size === 0) {
      return { success: false, error: 'File is empty (0 bytes)' };
    }

    // HEIC Conversion
    let processedUri = localUri;
    const isHeic = localUri.toLowerCase().endsWith('.heic');

    if (isHeic) {
      if (__DEV__) console.log('[Storage] Converting HEIC to JPEG...');
      try {
        const converted = await ImageManipulator.manipulateAsync(
          localUri,
          [],
          { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
        );
        processedUri = converted.uri;
        if (__DEV__) console.log('[Storage] Converted HEIC to JPEG:', processedUri.slice(0, 50));
      } catch (convertError) {
        if (__DEV__) console.error('[Storage] HEIC conversion failed:', convertError);
      }
    }

    // Generate Path
    const extension = processedUri !== localUri
      ? 'jpg'
      : (localUri.split('.').pop()?.toLowerCase() || 'jpg');
    const fileName = `${userId}/${itemId}/${Date.now()}.${extension}`;

    if (__DEV__) console.log(`[Storage] UPLOAD PATH: ${bucket}/${fileName}`);

    // Determine Content Type
    const contentType = processedUri !== localUri
      ? 'image/jpeg'
      : (options.contentType || getMimeType(localUri));

    // READ FILE CONTENT EXPLICITLY (Fix for 0-byte uploads)
    // SDK 54: Use File.base64() method for reading file content
    // Then decode to ArrayBuffer for Supabase upload
    const processedFile = processedUri !== localUri ? new ExpoFile(processedUri) : file;
    const base64 = await processedFile.base64();
    const fileData = decode(base64);

    if (__DEV__) console.log(`[Storage] Uploading to ${bucket}/${fileName} (${contentType}, ${fileData.byteLength} bytes)`);

    const { data, error } = await supabase!.storage
      .from(bucket)
      .upload(fileName, fileData, {
        contentType,
        upsert: options.upsert ?? false,
      });

    if (error) {
      if (__DEV__) console.error('[Storage] Upload error:', error);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase!.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (__DEV__) console.log(`[Storage] Upload successful: ${urlData.publicUrl}`);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    if (__DEV__) console.error('[Storage] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

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
      if (__DEV__) console.error('[Storage] Delete error:', error);
      return { success: false, error: error.message };
    }

    if (__DEV__) console.log(`[Storage] Deleted: ${bucket}/${path}`);
    return { success: true };
  } catch (error) {
    if (__DEV__) console.error('[Storage] Unexpected delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
  const pattern = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
  const match = url.match(pattern);
  return match?.[1] || null;
}
