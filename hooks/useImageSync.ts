/**
 * Image Sync Hook
 *
 * Manages the upload queue for local images.
 * Connects the ImageSyncQueue to the Legend-State stores.
 */

import { useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { imageSyncQueue } from '@/lib/legend-state/image-sync-queue';
import { getLocalImagesToUpload } from '@/lib/legend-state/type-mappers';
import { getStores, updateProject, updateInventoryItem } from '@/lib/legend-state/config';
import type { Project, InventoryItem } from '@/types';

export function useImageSync() {
  const { user, isPro } = useAuth();
  const { projects$, inventory$ } = getStores(user?.id ?? null, isPro);

  // 1. Initialize Queue with Callbacks
  useEffect(() => {
    if (!user?.id) return;

    imageSyncQueue.initialize(user.id, {
      onImageUploaded: async (itemId, itemType, imageIndex, newUrl, oldUri) => {
        if (__DEV__) console.log(`[ImageSync] Image uploaded for ${itemType} ${itemId}: ${newUrl}`);

        // Helper to parse images (handles both array and JSON string for backward compat)
        const parseImages = (raw: string[] | string | null | undefined): string[] => {
          if (Array.isArray(raw)) return raw;
          if (typeof raw === 'string') {
            try { return JSON.parse(raw || '[]'); } catch { return []; }
          }
          return [];
        };

        // Update the store with the new URL
        if (itemType === 'project') {
           // We need to read the current images to update safely
           const project = projects$[itemId].get();
           if (project) {
             const images = parseImages(project.images);

             // Replace URI
             const updated = images.map(img => img === oldUri ? newUrl : img);

             // Write back to store as array (DB uses TEXT[], not JSON string)
             updateProject(projects$, itemId, { images: updated });
           }
        } else if (itemType === 'inventory') {
           const item = inventory$[itemId].get();
           if (item) {
             const images = parseImages(item.images);
             const updated = images.map(img => img === oldUri ? newUrl : img);

             // Store as array (DB uses TEXT[], not JSON string)
             updateInventoryItem(inventory$, itemId, { images: updated });
           }
        }
      },
      onImageFailed: (itemId, error) => {
        if (__DEV__) console.warn(`[ImageSync] Upload failed for ${itemId}: ${error}`);
      },
      onStaleImageFound: async (itemId, itemType, staleUri) => {
        if (__DEV__) console.log(`[ImageSync] Cleaning stale image from ${itemType} ${itemId}`);

        // Helper to parse images (handles both array and JSON string for backward compat)
        const parseImages = (raw: string[] | string | null | undefined): string[] => {
          if (Array.isArray(raw)) return raw;
          if (typeof raw === 'string') {
            try { return JSON.parse(raw || '[]'); } catch { return []; }
          }
          return [];
        };

        // Remove the stale URI from the store
        if (itemType === 'project') {
          const project = projects$[itemId].get();
          if (project) {
            const images = parseImages(project.images);
            const filtered = images.filter(img => img !== staleUri);
            if (filtered.length !== images.length) {
              // Store as array (DB uses TEXT[], not JSON string)
              updateProject(projects$, itemId, { images: filtered });
              if (__DEV__) console.log(`[ImageSync] Removed stale image from project ${itemId}`);
            }
          }
        } else if (itemType === 'inventory') {
          const item = inventory$[itemId].get();
          if (item) {
            const images = parseImages(item.images);
            const filtered = images.filter(img => img !== staleUri);
            if (filtered.length !== images.length) {
              // Store as array (DB uses TEXT[], not JSON string)
              updateInventoryItem(inventory$, itemId, { images: filtered });
              if (__DEV__) console.log(`[ImageSync] Removed stale image from inventory ${itemId}`);
            }
          }
        }
      }
    });

    // Cleanup not strictly necessary as queue is singleton, but good practice if user changes
    return () => {
      // We don't want to kill the queue processing on unmount, so we leave it running
    };
  }, [user?.id, projects$, inventory$]);

  // 2. Helper to Queue Images for a Project
  const queueProjectImages = useCallback(async (project: Project) => {
    if (!user?.id) return;

    const images = typeof project.images === 'string' 
      ? JSON.parse(project.images) 
      : (project.images || []);
      
    const localImages = getLocalImagesToUpload(images);
    
    if (localImages.length > 0) {
      if (__DEV__) console.log(`[ImageSync] Queuing ${localImages.length} images for project ${project.id}`);
      await imageSyncQueue.enqueue(
        localImages.map(({ uri, index }) => ({
          localUri: uri,
          bucket: 'project-images',
          itemId: project.id,
          itemType: 'project',
          imageIndex: index,
        }))
      );
    }
  }, [user?.id]);

  // 3. Helper to Queue Images for Inventory
  const queueInventoryImages = useCallback(async (item: InventoryItem) => {
    if (!user?.id) return;

    const images = typeof item.images === 'string' 
      ? JSON.parse(item.images) 
      : (item.images || []);
      
    const localImages = getLocalImagesToUpload(images);
    
    if (localImages.length > 0) {
      if (__DEV__) console.log(`[ImageSync] Queuing ${localImages.length} images for inventory ${item.id}`);
      await imageSyncQueue.enqueue(
        localImages.map(({ uri, index }) => ({
          localUri: uri,
          bucket: 'inventory-images',
          itemId: item.id,
          itemType: 'inventory',
          imageIndex: index,
        }))
      );
    }
  }, [user?.id]);

  // 4. Bulk Scan (Run on mount or manual trigger)
  const scanForMissingUploads = useCallback(async () => {
    if (!user?.id) return;
    
    if (__DEV__) console.log('[ImageSync] Scanning for missing uploads...');
    const projects = projects$.get() || {};
    const inventory = inventory$.get() || {};

    let count = 0;

    for (const p of Object.values(projects) as Project[]) {
      await queueProjectImages(p);
      count++;
    }
    for (const i of Object.values(inventory) as InventoryItem[]) {
      await queueInventoryImages(i);
      count++;
    }
    if (__DEV__) console.log(`[ImageSync] Scanned ${count} records.`);
  }, [user?.id, projects$, inventory$, queueProjectImages, queueInventoryImages]);

  // Run scan once on mount (delayed slightly to let store load)
  useEffect(() => {
    if (user?.id) {
      const timer = setTimeout(() => scanForMissingUploads(), 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, scanForMissingUploads]);

  return {
    queueProjectImages,
    queueInventoryImages,
    scanForMissingUploads,
    queueStatus: imageSyncQueue.getStatus()
  };
}


