/**
 * Supabase Database Types - Aligned with SQLite (Source of Truth)
 *
 * These types match the local SQLite schema exactly.
 * No field name conversions needed between local and cloud.
 *
 * @see lib/database/schema.ts for SQLite schema
 * @see lib/database/migrations.ts for SQLite migrations
 * @see supabase/migrations/00015_align_schema_with_sqlite.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// ENUMS - MATCHING SQLITE EXACTLY
// ============================================================================

/**
 * Project status enum - matches SQLite/TypeScript ProjectStatus
 * @see types/index.ts
 */
export type ProjectStatus =
  | 'to-do'
  | 'in-progress'
  | 'on-hold'
  | 'completed'
  | 'frogged';

/**
 * Inventory category enum - matches SQLite categories
 */
export type InventoryCategory = 'yarn' | 'hook' | 'other';

// ============================================================================
// TABLE TYPES - MATCHING SQLITE EXACTLY
// ============================================================================

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          status: ProjectStatus;
          project_type: string | null;
          images: string[];
          default_image_index: number | null;
          pattern_pdf: string | null;
          pattern_url: string | null;
          pattern_images: string[] | null;
          inspiration_url: string | null;
          notes: string | null;
          yarn_used: string[];
          yarn_used_ids: string[] | null;
          hook_used_ids: string[] | null;
          yarn_materials: Json | null;
          work_progress: Json | null;
          inspiration_sources: Json | null;
          start_date: string | null;
          completed_date: string | null;
          created_at: string;
          updated_at: string;
          synced_at: string | null;
          deleted: boolean;
          // Currently Working On feature
          currently_working_on: boolean;
          currently_working_on_at: string | null;
          currently_working_on_ended_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          status?: ProjectStatus;
          project_type?: string | null;
          images?: string[];
          default_image_index?: number | null;
          pattern_pdf?: string | null;
          pattern_url?: string | null;
          pattern_images?: string[] | null;
          inspiration_url?: string | null;
          notes?: string | null;
          yarn_used?: string[];
          yarn_used_ids?: string[] | null;
          hook_used_ids?: string[] | null;
          yarn_materials?: Json | null;
          work_progress?: Json | null;
          inspiration_sources?: Json | null;
          start_date?: string | null;
          completed_date?: string | null;
          created_at?: string;
          updated_at?: string;
          synced_at?: string | null;
          deleted?: boolean;
          // Currently Working On feature
          currently_working_on?: boolean;
          currently_working_on_at?: string | null;
          currently_working_on_ended_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          status?: ProjectStatus;
          project_type?: string | null;
          images?: string[];
          default_image_index?: number | null;
          pattern_pdf?: string | null;
          pattern_url?: string | null;
          pattern_images?: string[] | null;
          inspiration_url?: string | null;
          notes?: string | null;
          yarn_used?: string[];
          yarn_used_ids?: string[] | null;
          hook_used_ids?: string[] | null;
          yarn_materials?: Json | null;
          work_progress?: Json | null;
          inspiration_sources?: Json | null;
          start_date?: string | null;
          completed_date?: string | null;
          created_at?: string;
          updated_at?: string;
          synced_at?: string | null;
          deleted?: boolean;
          // Currently Working On feature
          currently_working_on?: boolean;
          currently_working_on_at?: string | null;
          currently_working_on_ended_at?: string | null;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          user_id: string;
          category: InventoryCategory;
          name: string; // Matches SQLite (was 'title' in old Supabase)
          description: string;
          images: string[];
          quantity: number;
          unit: string | null;
          location: string | null;
          tags: string[];
          used_in_projects: string[];
          notes: string | null;
          barcode: string | null;
          date_added: string;
          last_updated: string;
          yarn_details: Json | null;
          hook_details: Json | null;
          other_details: Json | null; // Matches SQLite (was 'notion_details' in old Supabase)
          synced_at: string | null;
          deleted: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: InventoryCategory;
          name: string;
          description?: string;
          images?: string[];
          quantity?: number;
          unit?: string | null;
          location?: string | null;
          tags?: string[];
          used_in_projects?: string[];
          notes?: string | null;
          barcode?: string | null;
          date_added?: string;
          last_updated?: string;
          yarn_details?: Json | null;
          hook_details?: Json | null;
          other_details?: Json | null;
          synced_at?: string | null;
          deleted?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: InventoryCategory;
          name?: string;
          description?: string;
          images?: string[];
          quantity?: number;
          unit?: string | null;
          location?: string | null;
          tags?: string[];
          used_in_projects?: string[];
          notes?: string | null;
          barcode?: string | null;
          date_added?: string;
          last_updated?: string;
          yarn_details?: Json | null;
          hook_details?: Json | null;
          other_details?: Json | null;
          synced_at?: string | null;
          deleted?: boolean;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          role: 'ordinary' | 'pro' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'ordinary' | 'pro' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'ordinary' | 'pro' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      yarn_brands: {
        Row: {
          id: string;
          name: string;           // Normalized: lowercase, trimmed for matching
          display_name: string;   // Original casing for display
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Enums: {
      project_status: ProjectStatus;
      inventory_category: InventoryCategory;
    };
  };
}

// ============================================================================
// CONVENIENCE TYPE ALIASES
// ============================================================================

export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
export type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
export type InventoryItemUpdate = Database['public']['Tables']['inventory_items']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type YarnBrand = Database['public']['Tables']['yarn_brands']['Row'];
export type YarnBrandInsert = Database['public']['Tables']['yarn_brands']['Insert'];
export type YarnBrandUpdate = Database['public']['Tables']['yarn_brands']['Update'];
