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

  // Future migrations:
  // if (currentVersion < 2) {
  //   await migrateToV2(db);
  //   currentVersion = 2;
  // }

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
 * Check if AsyncStorage data needs to be migrated.
 * Returns true if migration has not been performed yet.
 */
export async function needsAsyncStorageMigration(db: SQLiteDatabase): Promise<boolean> {
  const result = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM sync_metadata WHERE key = 'asyncstorage_migrated'"
  );
  return result?.value !== 'true';
}

/**
 * Mark AsyncStorage migration as complete.
 */
export async function markAsyncStorageMigrationComplete(db: SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, ?)`,
    ['asyncstorage_migrated', 'true', now]
  );
  console.log('[SQLite] AsyncStorage migration marked as complete.');
}
