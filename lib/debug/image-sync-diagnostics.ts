/**
 * Image Sync Diagnostics
 *
 * Utilities to diagnose image sync issues.
 * Use these functions to trace the sync flow and identify problems.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const QUEUE_STORAGE_KEY = '@image-upload-queue';

export interface DiagnosticResult {
  timestamp: string;
  checkpoint: string;
  status: 'pass' | 'fail' | 'warning';
  details: Record<string, unknown>;
}

/**
 * Checkpoint 1: Check queue state
 */
export async function diagnoseQueueState(): Promise<DiagnosticResult> {
  const timestamp = new Date().toISOString();

  try {
    const queueData = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    const queue = queueData ? JSON.parse(queueData) : [];

    const pending = queue.filter((i: { status: string }) => i.status === 'pending').length;
    const uploading = queue.filter((i: { status: string }) => i.status === 'uploading').length;
    const completed = queue.filter((i: { status: string }) => i.status === 'completed').length;
    const failed = queue.filter((i: { status: string }) => i.status === 'failed').length;

    // Detailed item info
    const items = queue.map((item: {
      id: string;
      localUri: string;
      itemId: string;
      itemType: string;
      status: string;
      retryCount: number;
      lastError?: string;
      resultUrl?: string;
    }) => ({
      id: item.id,
      localUri: item.localUri?.slice(-60),
      itemId: item.itemId,
      itemType: item.itemType,
      status: item.status,
      retryCount: item.retryCount,
      lastError: item.lastError,
      hasResultUrl: !!item.resultUrl,
    }));

    return {
      timestamp,
      checkpoint: 'Queue State',
      status: failed > 0 ? 'fail' : pending > 0 ? 'warning' : 'pass',
      details: {
        total: queue.length,
        pending,
        uploading,
        completed,
        failed,
        items,
      },
    };
  } catch (error) {
    return {
      timestamp,
      checkpoint: 'Queue State',
      status: 'fail',
      details: { error: String(error) },
    };
  }
}

/**
 * Checkpoint 2: Check Supabase Storage connectivity
 */
export async function diagnoseSupabaseStorage(userId: string): Promise<DiagnosticResult> {
  const timestamp = new Date().toISOString();

  if (!isSupabaseConfigured || !supabase) {
    return {
      timestamp,
      checkpoint: 'Supabase Storage',
      status: 'fail',
      details: { error: 'Supabase not configured' },
    };
  }

  try {
    // List files in user's project-images folder
    const { data: projectImages, error: projectError } = await supabase.storage
      .from('project-images')
      .list(userId, { limit: 10 });

    const { data: inventoryImages, error: inventoryError } = await supabase.storage
      .from('inventory-images')
      .list(userId, { limit: 10 });

    return {
      timestamp,
      checkpoint: 'Supabase Storage',
      status: projectError || inventoryError ? 'fail' : 'pass',
      details: {
        projectImagesAccessible: !projectError,
        inventoryImagesAccessible: !inventoryError,
        projectError: projectError?.message,
        inventoryError: inventoryError?.message,
        projectImagesFolders: projectImages?.length ?? 0,
        inventoryImagesFolders: inventoryImages?.length ?? 0,
      },
    };
  } catch (error) {
    return {
      timestamp,
      checkpoint: 'Supabase Storage',
      status: 'fail',
      details: { error: String(error) },
    };
  }
}

/**
 * Checkpoint 3: Check for local vs cloud URLs in SQLite data
 */
export async function diagnoseImageUrls(
  projects: Array<{ id: string; title: string; images?: string[] }>,
  inventoryItems: Array<{ id: string; name: string; images?: string[] }>
): Promise<DiagnosticResult> {
  const timestamp = new Date().toISOString();

  const isLocalUri = (uri: string) =>
    uri.startsWith('file://') ||
    uri.startsWith('/') ||
    uri.includes('ImagePicker') ||
    uri.includes('cache');

  const isCloudUrl = (uri: string) =>
    uri.startsWith('https://') && uri.includes('supabase');

  let localProjectImages = 0;
  let cloudProjectImages = 0;
  let localInventoryImages = 0;
  let cloudInventoryImages = 0;

  const projectsWithLocalImages: Array<{ id: string; title: string; localCount: number }> = [];
  const inventoryWithLocalImages: Array<{ id: string; name: string; localCount: number }> = [];

  for (const project of projects) {
    const images = project.images || [];
    const local = images.filter(isLocalUri);
    const cloud = images.filter(isCloudUrl);

    localProjectImages += local.length;
    cloudProjectImages += cloud.length;

    if (local.length > 0) {
      projectsWithLocalImages.push({
        id: project.id,
        title: project.title,
        localCount: local.length,
      });
    }
  }

  for (const item of inventoryItems) {
    const images = item.images || [];
    const local = images.filter(isLocalUri);
    const cloud = images.filter(isCloudUrl);

    localInventoryImages += local.length;
    cloudInventoryImages += cloud.length;

    if (local.length > 0) {
      inventoryWithLocalImages.push({
        id: item.id,
        name: item.name,
        localCount: local.length,
      });
    }
  }

  const totalLocal = localProjectImages + localInventoryImages;
  const totalCloud = cloudProjectImages + cloudInventoryImages;

  return {
    timestamp,
    checkpoint: 'Image URLs in SQLite',
    status: totalLocal > 0 ? 'warning' : 'pass',
    details: {
      summary: {
        localImages: totalLocal,
        cloudImages: totalCloud,
        percentSynced: totalCloud + totalLocal > 0
          ? Math.round((totalCloud / (totalCloud + totalLocal)) * 100)
          : 100,
      },
      projects: {
        withLocalImages: projectsWithLocalImages.length,
        localCount: localProjectImages,
        cloudCount: cloudProjectImages,
        items: projectsWithLocalImages.slice(0, 5), // First 5
      },
      inventory: {
        withLocalImages: inventoryWithLocalImages.length,
        localCount: localInventoryImages,
        cloudCount: cloudInventoryImages,
        items: inventoryWithLocalImages.slice(0, 5), // First 5
      },
    },
  };
}

/**
 * Run all diagnostics
 */
export async function runAllDiagnostics(
  userId: string,
  projects: Array<{ id: string; title: string; images?: string[] }>,
  inventoryItems: Array<{ id: string; name: string; images?: string[] }>
): Promise<DiagnosticResult[]> {
  console.log('='.repeat(60));
  console.log('[Diagnostics] Starting image sync diagnostics...');
  console.log('='.repeat(60));

  const results: DiagnosticResult[] = [];

  // Run each diagnostic
  const queueResult = await diagnoseQueueState();
  console.log(`[Diagnostics] Queue State: ${queueResult.status}`);
  console.log(JSON.stringify(queueResult.details, null, 2));
  results.push(queueResult);

  const storageResult = await diagnoseSupabaseStorage(userId);
  console.log(`[Diagnostics] Storage: ${storageResult.status}`);
  console.log(JSON.stringify(storageResult.details, null, 2));
  results.push(storageResult);

  const urlsResult = await diagnoseImageUrls(projects, inventoryItems);
  console.log(`[Diagnostics] URLs: ${urlsResult.status}`);
  console.log(JSON.stringify(urlsResult.details, null, 2));
  results.push(urlsResult);

  console.log('='.repeat(60));
  console.log('[Diagnostics] Complete');
  console.log('='.repeat(60));

  return results;
}
