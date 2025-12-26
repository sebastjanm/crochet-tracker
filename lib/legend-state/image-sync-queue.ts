/**
 * Image Sync Queue
 *
 * Production-grade queue for uploading local images to Supabase Storage.
 * Features:
 * - Persistent queue (survives app restart via AsyncStorage)
 * - Non-blocking (doesn't block data sync)
 * - Retry with exponential backoff
 * - Deduplication
 *
 * @see /lib/supabase/storage.ts for upload logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadImage, isLocalFileUri, StorageBucket } from '@/lib/supabase/storage';

const QUEUE_STORAGE_KEY = '@image-upload-queue';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [0, 2000, 4000, 8000]; // Exponential backoff in ms

export type QueuedImageStatus = 'pending' | 'uploading' | 'completed' | 'failed';

export interface QueuedImage {
  /** Unique ID for this queue item */
  id: string;
  /** Local file:// URI */
  localUri: string;
  /** Target storage bucket */
  bucket: StorageBucket;
  /** Project or inventory item ID */
  itemId: string;
  /** Type of item (for callback routing) */
  itemType: 'project' | 'inventory';
  /** Index in the images array */
  imageIndex: number;
  /** Number of upload attempts */
  retryCount: number;
  /** Current status */
  status: QueuedImageStatus;
  /** When this was added to queue */
  createdAt: number;
  /** Last error message if failed */
  lastError?: string;
  /** Resulting URL after successful upload */
  resultUrl?: string;
}

export interface EnqueueOptions {
  localUri: string;
  bucket: StorageBucket;
  itemId: string;
  itemType: 'project' | 'inventory';
  imageIndex: number;
}

export interface ImageUploadCallbacks {
  /** Called when an image is successfully uploaded */
  onImageUploaded?: (
    itemId: string,
    itemType: 'project' | 'inventory',
    imageIndex: number,
    newUrl: string,
    oldUri: string
  ) => Promise<void>;
  /** Called when an image permanently fails */
  onImageFailed?: (
    itemId: string,
    itemType: 'project' | 'inventory',
    imageIndex: number,
    error: string
  ) => void;
}

/**
 * Image Sync Queue Manager
 *
 * Singleton class that manages the upload queue.
 */
class ImageSyncQueueManager {
  private queue: QueuedImage[] = [];
  private isProcessing = false;
  private isInitialized = false;
  private userId: string | null = null;
  private callbacks: ImageUploadCallbacks = {};

  /**
   * Initialize the queue manager
   *
   * @param userId - Current user ID (required for upload paths)
   * @param callbacks - Optional callbacks for upload events
   */
  async initialize(userId: string, callbacks?: ImageUploadCallbacks): Promise<void> {
    this.userId = userId;
    this.callbacks = callbacks || {};

    // Load persisted queue from AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as QueuedImage[];
        // Filter to only pending/uploading items (reset uploading to pending)
        this.queue = parsed
          .filter(item => item.status !== 'completed')
          .map(item => ({
            ...item,
            status: item.status === 'uploading' ? 'pending' : item.status,
          }));

        console.log(`[ImageQueue] Loaded ${this.queue.length} pending items from storage`);
      }
    } catch (error) {
      console.error('[ImageQueue] Failed to load queue from storage:', error);
      this.queue = [];
    }

    this.isInitialized = true;

    // Resume processing if there are pending items
    if (this.queue.some(item => item.status === 'pending')) {
      this.processQueue();
    }
  }

  /**
   * Cleanup and reset the queue manager
   */
  async cleanup(): Promise<void> {
    this.isProcessing = false;
    this.isInitialized = false;
    this.userId = null;
    this.callbacks = {};
    this.queue = [];
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  }

  /**
   * Persist queue to AsyncStorage
   */
  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[ImageQueue] Failed to persist queue:', error);
    }
  }

  /**
   * Generate unique ID for queue item
   */
  private generateId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Add images to the upload queue
   *
   * @param images - Array of images to queue
   * @returns Number of items actually added (excludes duplicates)
   */
  async enqueue(images: EnqueueOptions[]): Promise<number> {
    if (!this.isInitialized || !this.userId) {
      console.warn('[ImageQueue] Queue not initialized, cannot enqueue');
      return 0;
    }

    let added = 0;

    for (const image of images) {
      // Skip if not a local file
      if (!isLocalFileUri(image.localUri)) {
        continue;
      }

      // Skip if already in queue (dedupe by localUri + itemId)
      const exists = this.queue.some(
        q => q.localUri === image.localUri && q.itemId === image.itemId
      );
      if (exists) {
        console.log(`[ImageQueue] Skipping duplicate: ${image.localUri}`);
        continue;
      }

      const queuedImage: QueuedImage = {
        id: this.generateId(),
        localUri: image.localUri,
        bucket: image.bucket,
        itemId: image.itemId,
        itemType: image.itemType,
        imageIndex: image.imageIndex,
        retryCount: 0,
        status: 'pending',
        createdAt: Date.now(),
      };

      this.queue.push(queuedImage);
      added++;
      console.log(`[ImageQueue] Enqueued: ${image.localUri} for ${image.itemType}/${image.itemId}`);
    }

    if (added > 0) {
      await this.persistQueue();
      // Start processing if not already running
      this.processQueue();
    }

    return added;
  }

  /**
   * Process the upload queue
   *
   * Runs in background, processes items one at a time to avoid overwhelming the network.
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isInitialized || !this.userId) {
      return;
    }

    this.isProcessing = true;
    console.log('[ImageQueue] Starting queue processing');

    while (true) {
      // Find next pending item
      const item = this.queue.find(q => q.status === 'pending');
      if (!item) {
        break;
      }

      // Mark as uploading
      item.status = 'uploading';
      await this.persistQueue();

      // Attempt upload
      const success = await this.uploadItem(item);

      if (success) {
        item.status = 'completed';
        console.log(`[ImageQueue] Completed: ${item.id}`);

        // Trigger callback
        if (this.callbacks.onImageUploaded && item.resultUrl) {
          try {
            await this.callbacks.onImageUploaded(
              item.itemId,
              item.itemType,
              item.imageIndex,
              item.resultUrl,
              item.localUri
            );
          } catch (error) {
            console.error('[ImageQueue] Callback error:', error);
          }
        }
      } else {
        // Handle retry or failure
        item.retryCount++;

        if (item.retryCount >= MAX_RETRIES) {
          item.status = 'failed';
          console.error(`[ImageQueue] Failed permanently: ${item.id} - ${item.lastError}`);

          // Trigger failure callback
          if (this.callbacks.onImageFailed) {
            this.callbacks.onImageFailed(
              item.itemId,
              item.itemType,
              item.imageIndex,
              item.lastError || 'Unknown error'
            );
          }
        } else {
          // Schedule retry with backoff
          item.status = 'pending';
          const delay = RETRY_DELAYS[item.retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
          console.log(`[ImageQueue] Retrying ${item.id} in ${delay}ms (attempt ${item.retryCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      await this.persistQueue();
    }

    // Cleanup completed items older than 24h
    await this.cleanupCompleted();

    this.isProcessing = false;
    console.log('[ImageQueue] Queue processing complete');
  }

  /**
   * Upload a single item
   */
  private async uploadItem(item: QueuedImage): Promise<boolean> {
    if (!this.userId) {
      item.lastError = 'No user ID';
      return false;
    }

    try {
      const result = await uploadImage(
        item.localUri,
        item.bucket,
        this.userId,
        item.itemId
      );

      if (result.success && result.url) {
        item.resultUrl = result.url;
        return true;
      } else {
        item.lastError = result.error || 'Upload failed';
        return false;
      }
    } catch (error) {
      item.lastError = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  /**
   * Remove completed items older than 24 hours
   */
  private async cleanupCompleted(): Promise<void> {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const before = this.queue.length;

    this.queue = this.queue.filter(
      item => item.status !== 'completed' || item.createdAt > cutoff
    );

    if (this.queue.length < before) {
      console.log(`[ImageQueue] Cleaned up ${before - this.queue.length} completed items`);
      await this.persistQueue();
    }
  }

  /**
   * Get current queue status
   */
  getStatus(): {
    total: number;
    pending: number;
    uploading: number;
    completed: number;
    failed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(q => q.status === 'pending').length,
      uploading: this.queue.filter(q => q.status === 'uploading').length,
      completed: this.queue.filter(q => q.status === 'completed').length,
      failed: this.queue.filter(q => q.status === 'failed').length,
    };
  }

  /**
   * Get failed items for retry or display
   */
  getFailedItems(): QueuedImage[] {
    return this.queue.filter(q => q.status === 'failed');
  }

  /**
   * Retry all failed items
   */
  async retryFailed(): Promise<void> {
    const failed = this.queue.filter(q => q.status === 'failed');
    for (const item of failed) {
      item.status = 'pending';
      item.retryCount = 0;
    }
    await this.persistQueue();
    this.processQueue();
  }

  /**
   * Clear all failed items from queue
   */
  async clearFailed(): Promise<void> {
    this.queue = this.queue.filter(q => q.status !== 'failed');
    await this.persistQueue();
  }
}

// Export singleton instance
export const imageSyncQueue = new ImageSyncQueueManager();
