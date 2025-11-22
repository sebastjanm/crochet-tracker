/**
 * Data Migration Script: AsyncStorage → Supabase
 *
 * This script helps users migrate their existing local data to Supabase.
 * Run this after setting up Supabase and authenticating the user.
 *
 * Usage:
 *   bun run scripts/migrate-to-supabase.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase/client';
import type { Project, InventoryItem } from '../types';

interface MigrationResult {
  success: boolean;
  projectsMigrated: number;
  inventoryMigrated: number;
  errors: string[];
}

/**
 * Main migration function
 */
export async function migrateDataToSupabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    projectsMigrated: 0,
    inventoryMigrated: 0,
    errors: [],
  };

  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User must be authenticated to migrate data');
    }

    console.log(`Starting migration for user: ${user.email}`);

    // ========================================================================
    // MIGRATE PROJECTS
    // ========================================================================

    const projectsJson = await AsyncStorage.getItem('projects');

    if (projectsJson) {
      try {
        const projects: Project[] = JSON.parse(projectsJson);
        console.log(`Found ${projects.length} projects to migrate`);

        for (const project of projects) {
          // Transform project data for Supabase
          const supabaseProject = {
            id: project.id,
            user_id: user.id,
            title: project.title,
            status: project.status,
            images: project.images || [],
            default_image_index: project.defaultImageIndex || 0,
            pattern_pdf: project.patternPdf,
            pattern_url: project.patternUrl,
            inspiration_url: project.inspirationUrl,
            notes: project.notes,
            yarn_used: project.yarnUsed || [],
            project_type: project.projectType,
            start_date: project.startDate,
            completed_date: project.completedDate,
            created_at: project.createdAt,
            updated_at: project.updatedAt,
          };

          const { error } = await supabase
            .from('projects')
            .upsert(supabaseProject);

          if (error) {
            result.errors.push(`Failed to migrate project "${project.title}": ${error.message}`);
          } else {
            result.projectsMigrated++;
          }
        }
      } catch (error) {
        result.errors.push(`Failed to parse projects: ${error}`);
      }
    }

    // ========================================================================
    // MIGRATE INVENTORY
    // ========================================================================

    const inventoryJson = await AsyncStorage.getItem('inventory');

    if (inventoryJson) {
      try {
        const inventory: InventoryItem[] = JSON.parse(inventoryJson);
        console.log(`Found ${inventory.length} inventory items to migrate`);

        for (const item of inventory) {
          // Get display name for logging from root level
          const itemName = item.name || 'Untitled';

          // Transform inventory data for Supabase
          const supabaseItem = {
            id: item.id,
            user_id: user.id,
            category: item.category,
            description: item.description,
            images: item.images || [],
            quantity: item.quantity,
            unit: item.unit || 'piece',
            location: item.location,
            tags: item.tags || [],
            used_in_projects: item.usedInProjects || [],
            reserved: item.reserved || false,
            reserved_for_project: item.reservedForProject,
            notes: item.notes,
            barcode: item.barcode,
            date_added: item.dateAdded,
            last_updated: item.lastUpdated,
            last_used: item.lastUsed,
            yarn_details: item.yarnDetails,
            hook_details: item.hookDetails,
            other_details: item.otherDetails,
            upc_data: item.upcData,
          };

          const { error } = await supabase
            .from('inventory_items')
            .upsert(supabaseItem);

          if (error) {
            result.errors.push(`Failed to migrate inventory "${itemName}": ${error.message}`);
          } else {
            result.inventoryMigrated++;
          }
        }
      } catch (error) {
        result.errors.push(`Failed to parse inventory: ${error}`);
      }
    }

    // ========================================================================
    // MIGRATION COMPLETE
    // ========================================================================

    result.success = result.errors.length === 0;

    console.log('\n========================================');
    console.log('MIGRATION COMPLETE');
    console.log('========================================');
    console.log(`Projects migrated: ${result.projectsMigrated}`);
    console.log(`Inventory items migrated: ${result.inventoryMigrated}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach((error) => console.log(`  - ${error}`));
    }

    return result;
  } catch (error) {
    result.errors.push(`Migration failed: ${error}`);
    return result;
  }
}

/**
 * Backup existing AsyncStorage data before migration
 */
export async function backupAsyncStorageData(): Promise<void> {
  const projects = await AsyncStorage.getItem('projects');
  const inventory = await AsyncStorage.getItem('inventory');
  const user = await AsyncStorage.getItem('user');

  const backup = {
    timestamp: new Date().toISOString(),
    projects: projects ? JSON.parse(projects) : [],
    inventory: inventory ? JSON.parse(inventory) : [],
    user: user ? JSON.parse(user) : null,
  };

  await AsyncStorage.setItem('data_backup', JSON.stringify(backup));
  console.log('Data backed up to AsyncStorage key: data_backup');
}

/**
 * Clear AsyncStorage after successful migration
 * WARNING: Only call this after verifying data in Supabase!
 */
export async function clearLocalData(): Promise<void> {
  await AsyncStorage.multiRemove(['projects', 'inventory', 'user']);
  console.log('Local data cleared from AsyncStorage');
}

/**
 * Restore from backup if migration fails
 */
export async function restoreFromBackup(): Promise<void> {
  const backup = await AsyncStorage.getItem('data_backup');

  if (!backup) {
    throw new Error('No backup found');
  }

  const data = JSON.parse(backup);

  await AsyncStorage.setItem('projects', JSON.stringify(data.projects));
  await AsyncStorage.setItem('inventory', JSON.stringify(data.inventory));
  await AsyncStorage.setItem('user', JSON.stringify(data.user));

  console.log('Data restored from backup');
}

// ============================================================================
// CLI INTERFACE (optional - for testing)
// ============================================================================

if (require.main === module) {
  console.log('Data Migration Tool');
  console.log('===================\n');
  console.log('This script will migrate your data from AsyncStorage to Supabase.');
  console.log('Make sure you are logged in first!\n');

  migrateDataToSupabase()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Migration completed successfully!');
        console.log('Please verify your data in Supabase before clearing local storage.');
      } else {
        console.log('\n❌ Migration completed with errors.');
        console.log('Please review the errors above and try again.');
      }
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
    });
}
