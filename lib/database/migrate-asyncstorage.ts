/**
 * AsyncStorage to SQLite Migration
 *
 * One-time migration script to transfer existing data from AsyncStorage
 * to the new SQLite database. Runs automatically on first app launch
 * after the SQLite upgrade.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/sqlite/
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SQLiteDatabase } from 'expo-sqlite';
import { needsAsyncStorageMigration, markAsyncStorageMigrationComplete } from './migrations';
import { mapProjectToRow, mapInventoryItemToRow, generateId, now } from './schema';
import type { Project, InventoryItem, ProjectYarn } from '@/types';

/**
 * Migrate data from AsyncStorage to SQLite.
 * Should be called after SQLite database is initialized.
 */
export async function migrateFromAsyncStorage(db: SQLiteDatabase): Promise<void> {
  // Check if migration is needed
  const needsMigration = await needsAsyncStorageMigration(db);

  if (!needsMigration) {
    console.log('[Migration] AsyncStorage migration already complete, skipping.');
    return;
  }

  console.log('[Migration] Starting AsyncStorage to SQLite migration...');

  try {
    // Migrate projects
    await migrateProjects(db);

    // Migrate inventory
    await migrateInventory(db);

    // Mark migration as complete
    await markAsyncStorageMigrationComplete(db);

    console.log('[Migration] AsyncStorage migration completed successfully!');
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    // Don't mark as complete so it can be retried
    throw error;
  }
}

/**
 * Migrate projects from AsyncStorage to SQLite.
 */
async function migrateProjects(db: SQLiteDatabase): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('projects');
    if (!data) {
      console.log('[Migration] No projects found in AsyncStorage');
      return;
    }

    const projects: Project[] = JSON.parse(data);
    console.log(`[Migration] Found ${projects.length} projects to migrate`);

    if (projects.length === 0) return;

    // Migrate each project in a transaction
    await db.withTransactionAsync(async () => {
      for (const project of projects) {
        // Handle legacy data format: convert yarnUsedIds to yarnMaterials
        let yarnMaterials: ProjectYarn[] | undefined = project.yarnMaterials;
        if (!yarnMaterials && project.yarnUsedIds && project.yarnUsedIds.length > 0) {
          yarnMaterials = project.yarnUsedIds.map((id: string) => ({
            itemId: id,
            quantity: 1,
          }));
        }

        // Convert string dates from JSON to Date objects for mapProjectToRow
        const projectWithDates = {
          ...project,
          yarnMaterials,
          startDate: project.startDate ? new Date(project.startDate) : undefined,
          completedDate: project.completedDate ? new Date(project.completedDate) : undefined,
        };
        const row = mapProjectToRow(projectWithDates);
        const id = project.id || generateId();
        const createdAt = project.createdAt
          ? new Date(project.createdAt).toISOString()
          : now();
        const updatedAt = project.updatedAt
          ? new Date(project.updatedAt).toISOString()
          : now();

        await db.runAsync(
          `INSERT OR REPLACE INTO projects (
            id, title, description, status, project_type, images, default_image_index,
            pattern_pdf, pattern_url, pattern_images, inspiration_url, notes,
            yarn_used, yarn_used_ids, hook_used_ids, yarn_materials, work_progress,
            inspiration_sources, start_date, completed_date, created_at, updated_at, pending_sync
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            row.title,
            row.description,
            row.status,
            row.project_type,
            row.images,
            row.default_image_index,
            row.pattern_pdf,
            row.pattern_url,
            row.pattern_images,
            row.inspiration_url,
            row.notes,
            row.yarn_used,
            row.yarn_used_ids,
            row.hook_used_ids,
            row.yarn_materials,
            row.work_progress,
            row.inspiration_sources,
            row.start_date,
            row.completed_date,
            createdAt,
            updatedAt,
            0, // pending_sync = false for migrated data
          ]
        );
      }
    });

    console.log(`[Migration] Successfully migrated ${projects.length} projects`);
  } catch (error) {
    console.error('[Migration] Failed to migrate projects:', error);
    throw error;
  }
}

/**
 * Migrate inventory items from AsyncStorage to SQLite.
 */
async function migrateInventory(db: SQLiteDatabase): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('inventory');
    if (!data) {
      console.log('[Migration] No inventory items found in AsyncStorage');
      return;
    }

    const items: InventoryItem[] = JSON.parse(data);
    console.log(`[Migration] Found ${items.length} inventory items to migrate`);

    if (items.length === 0) return;

    // Migrate each item in a transaction
    await db.withTransactionAsync(async () => {
      for (const item of items) {
        const row = mapInventoryItemToRow(item);
        const id = item.id || generateId();
        const dateAdded = item.dateAdded
          ? new Date(item.dateAdded).toISOString()
          : now();
        const lastUpdated = item.lastUpdated
          ? new Date(item.lastUpdated).toISOString()
          : now();

        await db.runAsync(
          `INSERT OR REPLACE INTO inventory_items (
            id, category, name, description, images, quantity, unit,
            yarn_details, hook_details, other_details, location, tags,
            used_in_projects, notes, barcode, date_added, last_updated, pending_sync
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            row.category,
            row.name,
            row.description,
            row.images,
            row.quantity,
            row.unit,
            row.yarn_details,
            row.hook_details,
            row.other_details,
            row.location,
            row.tags,
            row.used_in_projects,
            row.notes,
            row.barcode,
            dateAdded,
            lastUpdated,
            0, // pending_sync = false for migrated data
          ]
        );
      }
    });

    console.log(`[Migration] Successfully migrated ${items.length} inventory items`);
  } catch (error) {
    console.error('[Migration] Failed to migrate inventory:', error);
    throw error;
  }
}

/**
 * Clear AsyncStorage data after successful migration.
 * Call this only after verifying the migration was successful.
 */
export async function clearAsyncStorageData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(['projects', 'inventory']);
    console.log('[Migration] Cleared AsyncStorage data');
  } catch (error) {
    console.error('[Migration] Failed to clear AsyncStorage:', error);
    // Non-fatal: data will just remain in AsyncStorage
  }
}

/**
 * Get migration status for debugging.
 */
export async function getMigrationStatus(db: SQLiteDatabase): Promise<{
  migrationComplete: boolean;
  projectsInSQLite: number;
  inventoryInSQLite: number;
  projectsInAsyncStorage: number;
  inventoryInAsyncStorage: number;
}> {
  const migrationComplete = !(await needsAsyncStorageMigration(db));

  // Count SQLite records
  const projectCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM projects'
  );
  const inventoryCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM inventory_items'
  );

  // Count AsyncStorage records
  let asyncProjects = 0;
  let asyncInventory = 0;

  try {
    const projectsData = await AsyncStorage.getItem('projects');
    if (projectsData) {
      asyncProjects = JSON.parse(projectsData).length;
    }
  } catch {
    // Ignore parse errors
  }

  try {
    const inventoryData = await AsyncStorage.getItem('inventory');
    if (inventoryData) {
      asyncInventory = JSON.parse(inventoryData).length;
    }
  } catch {
    // Ignore parse errors
  }

  return {
    migrationComplete,
    projectsInSQLite: projectCount?.count ?? 0,
    inventoryInSQLite: inventoryCount?.count ?? 0,
    projectsInAsyncStorage: asyncProjects,
    inventoryInAsyncStorage: asyncInventory,
  };
}
