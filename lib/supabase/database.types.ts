/**
 * Supabase Database Types - Production Schema
 *
 * Following Supabase best practices:
 * - UUID primary keys with foreign key constraints
 * - Standard timestamps: created_at, updated_at, deleted_at
 * - Soft deletes via deleted_at timestamp (NULL = active)
 *
 * @see supabase/migrations/00019_production_schema.sql
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
          project_type: string;
          images: string[];
          default_image_index: number;
          pattern_pdf: string;
          pattern_url: string;
          pattern_images: string[];
          inspiration_url: string;
          notes: string;
          yarn_used: string[];
          yarn_used_ids: string[];
          hook_used_ids: string[];
          yarn_materials: Json;
          work_progress: Json;
          inspiration_sources: Json;
          start_date: string | null;
          completed_date: string | null;
          currently_working_on: boolean;
          currently_working_on_at: string | null;
          currently_working_on_ended_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null; // NULL = active, timestamp = soft deleted
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          status?: ProjectStatus;
          project_type?: string;
          images?: string[];
          default_image_index?: number;
          pattern_pdf?: string;
          pattern_url?: string;
          pattern_images?: string[];
          inspiration_url?: string;
          notes?: string;
          yarn_used?: string[];
          yarn_used_ids?: string[];
          hook_used_ids?: string[];
          yarn_materials?: Json;
          work_progress?: Json;
          inspiration_sources?: Json;
          start_date?: string | null;
          completed_date?: string | null;
          currently_working_on?: boolean;
          currently_working_on_at?: string | null;
          currently_working_on_ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          status?: ProjectStatus;
          project_type?: string;
          images?: string[];
          default_image_index?: number;
          pattern_pdf?: string;
          pattern_url?: string;
          pattern_images?: string[];
          inspiration_url?: string;
          notes?: string;
          yarn_used?: string[];
          yarn_used_ids?: string[];
          hook_used_ids?: string[];
          yarn_materials?: Json;
          work_progress?: Json;
          inspiration_sources?: Json;
          start_date?: string | null;
          completed_date?: string | null;
          currently_working_on?: boolean;
          currently_working_on_at?: string | null;
          currently_working_on_ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          user_id: string;
          category: InventoryCategory;
          name: string;
          description: string;
          quantity: number;
          unit: string;
          images: string[];
          tags: string[];
          used_in_projects: string[];
          location: string;
          barcode: string;
          notes: string;
          yarn_details: Json | null;
          hook_details: Json | null;
          other_details: Json | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null; // NULL = active, timestamp = soft deleted
        };
        Insert: {
          id?: string;
          user_id: string;
          category: InventoryCategory;
          name: string;
          description?: string;
          quantity?: number;
          unit?: string;
          images?: string[];
          tags?: string[];
          used_in_projects?: string[];
          location?: string;
          barcode?: string;
          notes?: string;
          yarn_details?: Json | null;
          hook_details?: Json | null;
          other_details?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: InventoryCategory;
          name?: string;
          description?: string;
          quantity?: number;
          unit?: string;
          images?: string[];
          tags?: string[];
          used_in_projects?: string[];
          location?: string;
          barcode?: string;
          notes?: string;
          yarn_details?: Json | null;
          hook_details?: Json | null;
          other_details?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
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
