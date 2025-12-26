/**
 * SQLite Database Migrations
 *
 * Uses PRAGMA user_version for version tracking.
 * Each migration is idempotent - safe to run multiple times.
 * Includes automatic AsyncStorage data migration on first run.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/sqlite/
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { migrateFromAsyncStorage } from './migrate-asyncstorage';

/**
 * Run all pending migrations on database initialization.
 * Called by SQLiteProvider's onInit callback.
 */
export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  // Get current schema version
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let currentVersion = result?.user_version ?? 0;

  console.log(`[SQLite] Current schema version: ${currentVersion}`);

  // Run migrations in sequence
  if (currentVersion < 1) {
    await migrateToV1(db);
    currentVersion = 1;
  }

  if (currentVersion < 2) {
    await migrateToV2(db);
    currentVersion = 2;
  }

  if (currentVersion < 3) {
    await migrateToV3(db);
    currentVersion = 3;
  }

  // Enable WAL mode for better concurrent read/write performance
  await db.execAsync('PRAGMA journal_mode = WAL');

  console.log(`[SQLite] Schema migration complete. Version: ${currentVersion}`);

  // Migrate data from AsyncStorage (one-time migration)
  try {
    await migrateFromAsyncStorage(db);
  } catch (error) {
    console.error('[SQLite] AsyncStorage migration failed:', error);
    // Don't throw - app can still function with empty database
  }
}

/**
 * V1: Initial schema - projects and inventory_items tables
 */
async function migrateToV1(db: SQLiteDatabase): Promise<void> {
  console.log('[SQLite] Running migration to v1...');

  await db.execAsync(`
    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'to-do',
      project_type TEXT,
      images TEXT,
      default_image_index INTEGER,
      pattern_pdf TEXT,
      pattern_url TEXT,
      pattern_images TEXT,
      inspiration_url TEXT,
      notes TEXT,
      yarn_used TEXT,
      yarn_used_ids TEXT,
      hook_used_ids TEXT,
      yarn_materials TEXT,
      work_progress TEXT,
      inspiration_sources TEXT,
      start_date TEXT,
      completed_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      pending_sync INTEGER DEFAULT 0
    );

    -- Inventory items table
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      images TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit TEXT,
      yarn_details TEXT,
      hook_details TEXT,
      other_details TEXT,
      location TEXT,
      tags TEXT,
      used_in_projects TEXT,
      notes TEXT,
      barcode TEXT,
      date_added TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      synced_at TEXT,
      pending_sync INTEGER DEFAULT 0
    );

    -- Sync metadata table (for tracking sync state)
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
    CREATE INDEX IF NOT EXISTS idx_inventory_updated ON inventory_items(last_updated DESC);
    CREATE INDEX IF NOT EXISTS idx_projects_pending ON projects(pending_sync);
    CREATE INDEX IF NOT EXISTS idx_inventory_pending ON inventory_items(pending_sync);

    -- Set schema version
    PRAGMA user_version = 1;
  `);

  console.log('[SQLite] Migration to v1 complete.');
}

/**
 * V2: Add user_id column for cloud sync support
 * - Adds user_id to projects and inventory_items
 * - Creates indexes for user_id queries
 * - Orphaned records (user_id = NULL) will be claimed on first sync
 */
async function migrateToV2(db: SQLiteDatabase): Promise<void> {
  console.log('[SQLite] Running migration to v2...');

  // SQLite doesn't support IF NOT EXISTS for ALTER TABLE,
  // so we need to check if columns exist first
  const projectsCols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(projects)"
  );
  const inventoryCols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(inventory_items)"
  );

  const projectsHasUserId = projectsCols.some(col => col.name === 'user_id');
  const inventoryHasUserId = inventoryCols.some(col => col.name === 'user_id');

  // Add user_id column to projects if not exists
  if (!projectsHasUserId) {
    await db.execAsync('ALTER TABLE projects ADD COLUMN user_id TEXT');
    console.log('[SQLite] Added user_id column to projects');
  }

  // Add user_id column to inventory_items if not exists
  if (!inventoryHasUserId) {
    await db.execAsync('ALTER TABLE inventory_items ADD COLUMN user_id TEXT');
    console.log('[SQLite] Added user_id column to inventory_items');
  }

  // Create indexes for user_id queries (for efficient sync filtering)
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_user_sync ON projects(user_id, pending_sync);
    CREATE INDEX IF NOT EXISTS idx_inventory_user_sync ON inventory_items(user_id, pending_sync);

    -- Set schema version
    PRAGMA user_version = 2;
  `);

  console.log('[SQLite] Migration to v2 complete.');
}

/**
 * V3: Add soft delete support for Legend-State sync
 * - Adds deleted column to projects and inventory_items
 * - Creates indexes for deleted queries
 * @see https://legendapp.com/open-source/state/v3/sync/supabase/
 */
async function migrateToV3(db: SQLiteDatabase): Promise<void> {
  console.log('[SQLite] Running migration to v3 (Legend-State soft deletes)...');

  // Check if columns exist
  const projectsCols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(projects)"
  );
  const inventoryCols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(inventory_items)"
  );

  const projectsHasDeleted = projectsCols.some(col => col.name === 'deleted');
  const inventoryHasDeleted = inventoryCols.some(col => col.name === 'deleted');

  // Add deleted column to projects if not exists
  if (!projectsHasDeleted) {
    await db.execAsync('ALTER TABLE projects ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0');
    console.log('[SQLite] Added deleted column to projects');
  }

  // Add deleted column to inventory_items if not exists
  if (!inventoryHasDeleted) {
    await db.execAsync('ALTER TABLE inventory_items ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0');
    console.log('[SQLite] Added deleted column to inventory_items');
  }

  // Create indexes for deleted queries
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects(deleted);
    CREATE INDEX IF NOT EXISTS idx_inventory_deleted ON inventory_items(deleted);
    CREATE INDEX IF NOT EXISTS idx_projects_user_deleted ON projects(user_id, deleted);
    CREATE INDEX IF NOT EXISTS idx_inventory_user_deleted ON inventory_items(user_id, deleted);

    -- Set schema version
    PRAGMA user_version = 3;
  `);

  console.log('[SQLite] Migration to v3 complete.');
}

