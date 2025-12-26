/**
 * Legend-State Sync Manager
 *
 * Bridges the existing SQLite/Context architecture with Supabase sync.
 * Uses direct Supabase calls with Legend-State observable pattern
 * for production-grade offline-first sync.
 *
 * Architecture:
 * - SQLite remains the local source of truth
 * - This manager handles Supabase sync (Pro users only)
 * - Changes flow: SQLite → Context → SyncManager → Supabase
 * - Remote changes: Supabase Realtime → onSync callback → Context refresh
 *
 * @see https://supabase.com/blog/local-first-expo-legend-state
 */

import { supabase } from '@/lib/supabase/client';
import type { Project, InventoryItem } from '@/lib/supabase/database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { imageSyncQueue } from './image-sync-queue';
import { getLocalImagesToUpload, filterLocalImages } from './type-mappers';

// ============================================================================
// TYPES
// ============================================================================

export interface SyncResult {
  success: boolean;
  pullCount: number;
  pushCount: number;
  errors: string[];
}

export interface SyncCallbacks {
  onProjectsChanged?: () => Promise<void>;
  onInventoryChanged?: () => Promise<void>;
}

// ============================================================================
// SYNC MANAGER CLASS
// ============================================================================

/**
 * SyncManager handles Supabase sync for Pro users.
 * Uses Supabase Realtime for live updates.
 *
 * NOTE: Image sync queue is initialized separately in LegendStateSyncManager
 * (_layout.tsx) with proper callbacks that have access to context methods.
 */
export class SyncManager {
  private userId: string;
  private callbacks: SyncCallbacks;
  private isInitialized = false;
  private projectsChannel: RealtimeChannel | null = null;
  private inventoryChannel: RealtimeChannel | null = null;

  constructor(userId: string, callbacks: SyncCallbacks = {}) {
    this.userId = userId;
    this.callbacks = callbacks;
  }

  /**
   * Initialize Supabase Realtime subscriptions for Pro user.
   * Must be called after user is authenticated.
   */
  async initialize(): Promise<void> {
    if (!supabase) {
      console.warn('[SyncManager] Supabase not configured, skipping initialization');
      return;
    }

    if (this.isInitialized) {
      console.log('[SyncManager] Already initialized');
      return;
    }

    console.log(`[SyncManager] Initializing for user: ${this.userId}`);

    try {
      // Subscribe to projects changes
      this.projectsChannel = supabase
        .channel('projects-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: `user_id=eq.${this.userId}`,
          },
          async (payload) => {
            console.log('[SyncManager] Projects change received:', payload.eventType);
            await this.callbacks.onProjectsChanged?.();
          }
        )
        .subscribe((status) => {
          console.log('[SyncManager] Projects subscription status:', status);
        });

      // Subscribe to inventory changes
      this.inventoryChannel = supabase
        .channel('inventory-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'inventory_items',
            filter: `user_id=eq.${this.userId}`,
          },
          async (payload) => {
            console.log('[SyncManager] Inventory change received:', payload.eventType);
            await this.callbacks.onInventoryChanged?.();
          }
        )
        .subscribe((status) => {
          console.log('[SyncManager] Inventory subscription status:', status);
        });

      // NOTE: Image sync queue is initialized in LegendStateSyncManager (_layout.tsx)
      // with proper callbacks that have access to replaceProjectImage/replaceInventoryImage.
      // Do NOT initialize here to avoid overwriting those callbacks.

      this.isInitialized = true;
      console.log('[SyncManager] Initialized successfully');
    } catch (error) {
      console.error('[SyncManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Push a project to Supabase (upsert).
   * Queues local images for upload and syncs only cloud URLs.
   */
  async pushProject(project: Project): Promise<void> {
    if (!supabase || !this.isInitialized) {
      console.warn('[SyncManager] Not initialized, cannot push project');
      return;
    }

    try {
      // Queue local images for upload (non-blocking)
      const images = project.images || [];
      const localImages = getLocalImagesToUpload(images);

      if (localImages.length > 0) {
        console.log(`[SyncManager] Queueing ${localImages.length} local images for project ${project.id}`);
        console.log(`[SyncManager] Local URIs:`, localImages.map(l => l.uri.slice(0, 50)));
        await imageSyncQueue.enqueue(
          localImages.map(({ uri, index }) => ({
            localUri: uri,
            bucket: 'project-images' as const,
            itemId: project.id,
            itemType: 'project' as const,
            imageIndex: index,
          }))
        );
      }

      // Filter out local file:// URIs - only sync cloud URLs
      const cloudImages = filterLocalImages(images);

      // Ensure user_id is set
      const projectWithUser = {
        ...project,
        images: cloudImages, // Only cloud URLs
        user_id: this.userId,
        synced_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('projects')
        .upsert(projectWithUser as never, { onConflict: 'id' });

      if (error) {
        console.error('[SyncManager] Failed to push project:', error);
        throw error;
      }

      console.log(`[SyncManager] Pushed project: ${project.id} (${cloudImages.length} cloud images, ${localImages.length} queued)`);
    } catch (error) {
      console.error('[SyncManager] Push project failed:', error);
      throw error;
    }
  }

  /**
   * Push an inventory item to Supabase (upsert).
   * Queues local images for upload and syncs only cloud URLs.
   */
  async pushInventoryItem(item: InventoryItem): Promise<void> {
    if (!supabase || !this.isInitialized) {
      console.warn('[SyncManager] Not initialized, cannot push inventory item');
      return;
    }

    try {
      // Queue local images for upload (non-blocking)
      const images = item.images || [];
      const localImages = getLocalImagesToUpload(images);

      if (localImages.length > 0) {
        console.log(`[SyncManager] Queueing ${localImages.length} local images for inventory ${item.id}`);
        await imageSyncQueue.enqueue(
          localImages.map(({ uri, index }) => ({
            localUri: uri,
            bucket: 'inventory-images' as const,
            itemId: item.id,
            itemType: 'inventory' as const,
            imageIndex: index,
          }))
        );
      }

      // Filter out local file:// URIs - only sync cloud URLs
      const cloudImages = filterLocalImages(images);

      // Ensure user_id is set
      const itemWithUser = {
        ...item,
        images: cloudImages, // Only cloud URLs
        user_id: this.userId,
        synced_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('inventory_items')
        .upsert(itemWithUser as never, { onConflict: 'id' });

      if (error) {
        console.error('[SyncManager] Failed to push inventory item:', error);
        throw error;
      }

      console.log(`[SyncManager] Pushed inventory item: ${item.id} (${cloudImages.length} cloud images, ${localImages.length} queued)`);
    } catch (error) {
      console.error('[SyncManager] Push inventory item failed:', error);
      throw error;
    }
  }

  /**
   * Delete a project (soft delete).
   */
  async deleteProject(id: string): Promise<void> {
    if (!supabase || !this.isInitialized) {
      console.warn('[SyncManager] Not initialized, cannot delete project');
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          deleted: true,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .eq('user_id', this.userId);

      if (error) {
        console.error('[SyncManager] Failed to soft delete project:', error);
        throw error;
      }

      console.log(`[SyncManager] Soft deleted project: ${id}`);
    } catch (error) {
      console.error('[SyncManager] Delete project failed:', error);
      throw error;
    }
  }

  /**
   * Delete an inventory item (soft delete).
   */
  async deleteInventoryItem(id: string): Promise<void> {
    if (!supabase || !this.isInitialized) {
      console.warn('[SyncManager] Not initialized, cannot delete inventory item');
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          deleted: true,
          last_updated: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .eq('user_id', this.userId);

      if (error) {
        console.error('[SyncManager] Failed to soft delete inventory item:', error);
        throw error;
      }

      console.log(`[SyncManager] Soft deleted inventory item: ${id}`);
    } catch (error) {
      console.error('[SyncManager] Delete inventory item failed:', error);
      throw error;
    }
  }

  /**
   * Pull all projects from Supabase for this user.
   */
  async pullProjects(): Promise<Project[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', this.userId)
        .eq('deleted', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[SyncManager] Failed to pull projects:', error);
        throw error;
      }

      return (data || []) as Project[];
    } catch (error) {
      console.error('[SyncManager] Pull projects failed:', error);
      return [];
    }
  }

  /**
   * Pull all inventory items from Supabase for this user.
   */
  async pullInventoryItems(): Promise<InventoryItem[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', this.userId)
        .eq('deleted', false)
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('[SyncManager] Failed to pull inventory items:', error);
        throw error;
      }

      return (data || []) as InventoryItem[];
    } catch (error) {
      console.error('[SyncManager] Pull inventory items failed:', error);
      return [];
    }
  }

  /**
   * Check if sync is initialized and ready.
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Bulk queue all pending images from existing projects and inventory.
   * Call this to upload images that were created before sync was enabled.
   *
   * @param projects - All local projects (from SQLite)
   * @param inventoryItems - All local inventory items (from SQLite)
   * @returns Count of queued vs already uploaded images
   */
  async bulkQueuePendingImages(
    projects: Array<{ id: string; images?: (string | unknown)[] }>,
    inventoryItems: Array<{ id: string; images?: (string | unknown)[] }>
  ): Promise<{ queued: number; alreadyCloud: number; totalScanned: number }> {
    if (!this.isInitialized) {
      console.warn('[SyncManager] Not initialized, cannot bulk queue images');
      return { queued: 0, alreadyCloud: 0, totalScanned: 0 };
    }

    let queued = 0;
    let alreadyCloud = 0;
    let totalScanned = 0;

    console.log(`[SyncManager] Bulk scanning ${projects.length} projects and ${inventoryItems.length} inventory items`);

    // Process projects
    for (const project of projects) {
      const images = project.images || [];
      totalScanned += images.length;
      const localImages = getLocalImagesToUpload(images);

      if (localImages.length > 0) {
        await imageSyncQueue.enqueue(
          localImages.map(({ uri, index }) => ({
            localUri: uri,
            bucket: 'project-images' as const,
            itemId: project.id,
            itemType: 'project' as const,
            imageIndex: index,
          }))
        );
        queued += localImages.length;
      }
      alreadyCloud += images.length - localImages.length;
    }

    // Process inventory
    for (const item of inventoryItems) {
      const images = item.images || [];
      totalScanned += images.length;
      const localImages = getLocalImagesToUpload(images);

      if (localImages.length > 0) {
        await imageSyncQueue.enqueue(
          localImages.map(({ uri, index }) => ({
            localUri: uri,
            bucket: 'inventory-images' as const,
            itemId: item.id,
            itemType: 'inventory' as const,
            imageIndex: index,
          }))
        );
        queued += localImages.length;
      }
      alreadyCloud += images.length - localImages.length;
    }

    console.log(`[SyncManager] Bulk queue complete: ${queued} queued, ${alreadyCloud} already cloud, ${totalScanned} total`);
    return { queued, alreadyCloud, totalScanned };
  }

  /**
   * Find 0-byte images in Supabase Storage that need re-uploading.
   * Returns list of files with size === 0.
   */
  async findZeroByteImages(): Promise<Array<{
    bucket: 'project-images' | 'inventory-images';
    path: string;
    name: string;
  }>> {
    if (!supabase) return [];

    const zeroByteFiles: Array<{
      bucket: 'project-images' | 'inventory-images';
      path: string;
      name: string;
    }> = [];

    const buckets: Array<'project-images' | 'inventory-images'> = ['project-images', 'inventory-images'];

    for (const bucket of buckets) {
      try {
        // List all folders for this user
        const { data: folders, error: folderError } = await supabase.storage
          .from(bucket)
          .list(this.userId, { limit: 1000 });

        if (folderError) {
          console.error(`[SyncManager] Error listing ${bucket}:`, folderError);
          continue;
        }

        // For each folder (itemId), list files
        for (const folder of folders || []) {
          if (folder.id === null) {
            // This is a subfolder, list its contents
            const { data: files, error: fileError } = await supabase.storage
              .from(bucket)
              .list(`${this.userId}/${folder.name}`, { limit: 1000 });

            if (fileError) continue;

            for (const file of files || []) {
              // Check if file is 0 bytes
              const metadata = file.metadata as { size?: number } | null;
              if (metadata?.size === 0) {
                zeroByteFiles.push({
                  bucket,
                  path: `${this.userId}/${folder.name}/${file.name}`,
                  name: file.name,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`[SyncManager] Error scanning ${bucket}:`, error);
      }
    }

    console.log(`[SyncManager] Found ${zeroByteFiles.length} zero-byte files`);
    return zeroByteFiles;
  }

  /**
   * Delete a file from Supabase Storage.
   */
  async deleteStorageFile(bucket: 'project-images' | 'inventory-images', path: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) {
        console.error(`[SyncManager] Failed to delete ${path}:`, error);
        return false;
      }
      console.log(`[SyncManager] Deleted ${bucket}/${path}`);
      return true;
    } catch (error) {
      console.error(`[SyncManager] Error deleting file:`, error);
      return false;
    }
  }

  /**
   * Cleanup sync manager on logout.
   */
  async cleanup(): Promise<void> {
    console.log('[SyncManager] Cleaning up');

    if (this.projectsChannel && supabase) {
      supabase.removeChannel(this.projectsChannel);
      this.projectsChannel = null;
    }

    if (this.inventoryChannel && supabase) {
      supabase.removeChannel(this.inventoryChannel);
      this.inventoryChannel = null;
    }

    // Cleanup image sync queue
    await imageSyncQueue.cleanup();

    this.isInitialized = false;
  }

  /**
   * Get image upload queue status for UI display.
   */
  getImageQueueStatus() {
    return imageSyncQueue.getStatus();
  }

  /**
   * Retry all failed image uploads.
   */
  async retryFailedImageUploads(): Promise<void> {
    await imageSyncQueue.retryFailed();
  }
}

// ============================================================================
// SINGLETON INSTANCE MANAGER
// ============================================================================

let currentSyncManager: SyncManager | null = null;

/**
 * Get or create sync manager for a user.
 * Returns null if user is not Pro or Supabase is not configured.
 *
 * NOTE: Image sync queue is initialized separately in LegendStateSyncManager
 * with proper callbacks. Do not pass image callbacks here.
 */
export function getSyncManager(
  userId: string,
  isPro: boolean,
  callbacks?: SyncCallbacks
): SyncManager | null {
  if (!isPro || !supabase) {
    // Cleanup existing manager if user is no longer Pro
    if (currentSyncManager) {
      void currentSyncManager.cleanup();
      currentSyncManager = null;
    }
    return null;
  }

  // Create new manager if needed
  if (!currentSyncManager || (currentSyncManager as unknown as { userId: string }).userId !== userId) {
    if (currentSyncManager) {
      void currentSyncManager.cleanup();
    }
    currentSyncManager = new SyncManager(userId, callbacks);
  }

  return currentSyncManager;
}

/**
 * Cleanup sync manager (call on logout).
 */
export async function cleanupSyncManager(): Promise<void> {
  if (currentSyncManager) {
    await currentSyncManager.cleanup();
    currentSyncManager = null;
  }
}
