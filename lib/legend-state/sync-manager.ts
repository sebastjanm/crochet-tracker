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

      this.isInitialized = true;
      console.log('[SyncManager] Initialized successfully');
    } catch (error) {
      console.error('[SyncManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Push a project to Supabase (upsert).
   */
  async pushProject(project: Project): Promise<void> {
    if (!supabase || !this.isInitialized) {
      console.warn('[SyncManager] Not initialized, cannot push project');
      return;
    }

    try {
      // Ensure user_id is set
      const projectWithUser = {
        ...project,
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

      console.log(`[SyncManager] Pushed project: ${project.id}`);
    } catch (error) {
      console.error('[SyncManager] Push project failed:', error);
      throw error;
    }
  }

  /**
   * Push an inventory item to Supabase (upsert).
   */
  async pushInventoryItem(item: InventoryItem): Promise<void> {
    if (!supabase || !this.isInitialized) {
      console.warn('[SyncManager] Not initialized, cannot push inventory item');
      return;
    }

    try {
      // Ensure user_id is set
      const itemWithUser = {
        ...item,
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

      console.log(`[SyncManager] Pushed inventory item: ${item.id}`);
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
   * Cleanup sync manager on logout.
   */
  cleanup(): void {
    console.log('[SyncManager] Cleaning up');

    if (this.projectsChannel && supabase) {
      supabase.removeChannel(this.projectsChannel);
      this.projectsChannel = null;
    }

    if (this.inventoryChannel && supabase) {
      supabase.removeChannel(this.inventoryChannel);
      this.inventoryChannel = null;
    }

    this.isInitialized = false;
  }
}

// ============================================================================
// SINGLETON INSTANCE MANAGER
// ============================================================================

let currentSyncManager: SyncManager | null = null;

/**
 * Get or create sync manager for a user.
 * Returns null if user is not Pro or Supabase is not configured.
 */
export function getSyncManager(
  userId: string,
  isPro: boolean,
  callbacks?: SyncCallbacks
): SyncManager | null {
  if (!isPro || !supabase) {
    // Cleanup existing manager if user is no longer Pro
    if (currentSyncManager) {
      currentSyncManager.cleanup();
      currentSyncManager = null;
    }
    return null;
  }

  // Create new manager if needed
  if (!currentSyncManager || (currentSyncManager as unknown as { userId: string }).userId !== userId) {
    if (currentSyncManager) {
      currentSyncManager.cleanup();
    }
    currentSyncManager = new SyncManager(userId, callbacks);
  }

  return currentSyncManager;
}

/**
 * Cleanup sync manager (call on logout).
 */
export function cleanupSyncManager(): void {
  if (currentSyncManager) {
    currentSyncManager.cleanup();
    currentSyncManager = null;
  }
}
