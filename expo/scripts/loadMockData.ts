import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockUser, mockProjects, mockInventory, getMockDataStats } from '@/data/mockData';

/**
 * MOCK DATA LOADER UTILITY
 *
 * This script provides functions to load mock data into AsyncStorage.
 * Use during development to quickly populate the app with realistic data.
 *
 * Usage:
 *   import { loadAllMockData, clearAllData } from '@/scripts/loadMockData';
 *
 *   // Load all mock data
 *   await loadAllMockData();
 *
 *   // Clear all data
 *   await clearAllData();
 *
 *   // Load specific data
 *   await loadMockUser();
 *   await loadMockProjects();
 *   await loadMockInventory();
 */

// =======================
// STORAGE KEYS (matching context providers)
// =======================

const STORAGE_KEYS = {
  USER: 'user',
  PROJECTS: 'projects',
  INVENTORY: 'inventory',
};

// =======================
// INDIVIDUAL LOADERS
// =======================

/**
 * Load mock user into AsyncStorage
 */
export async function loadMockUser(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    console.log('✅ Mock user loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load mock user:', error);
    throw error;
  }
}

/**
 * Load mock projects into AsyncStorage
 */
export async function loadMockProjects(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(mockProjects));
    console.log(`✅ Mock projects loaded successfully (${mockProjects.length} projects)`);
  } catch (error) {
    console.error('❌ Failed to load mock projects:', error);
    throw error;
  }
}

/**
 * Load mock inventory into AsyncStorage
 */
export async function loadMockInventory(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(mockInventory));
    console.log(`✅ Mock inventory loaded successfully (${mockInventory.length} items)`);
  } catch (error) {
    console.error('❌ Failed to load mock inventory:', error);
    throw error;
  }
}

// =======================
// BULK OPERATIONS
// =======================

/**
 * Load all mock data into AsyncStorage
 * @param options.clearExisting - If true, clears existing data before loading
 */
export async function loadAllMockData(options: { clearExisting?: boolean } = {}): Promise<void> {
  try {
    console.log('📦 Loading mock data...');

    if (options.clearExisting) {
      console.log('🗑️  Clearing existing data first...');
      await clearAllData();
    }

    // Load all data in parallel
    await Promise.all([loadMockUser(), loadMockProjects(), loadMockInventory()]);

    // Print stats
    const stats = getMockDataStats();
    console.log('\n✨ Mock data loaded successfully!');
    console.log('📊 Statistics:');
    console.log(`   • User: ${mockUser.name} (${mockUser.email})`);
    console.log(`   • Projects: ${stats.totalProjects} total`);
    console.log(`     - To-Do: ${stats.projectsByStatus['to-do']}`);
    console.log(`     - In Progress: ${stats.projectsByStatus['in-progress']}`);
    console.log(`     - On Hold: ${stats.projectsByStatus['on-hold']}`);
    console.log(`     - Completed: ${stats.projectsByStatus.completed}`);
    console.log(`     - Frogged: ${stats.projectsByStatus.frogged}`);
    console.log(`   • Inventory: ${stats.totalInventory} items`);
    console.log(`     - Yarn: ${stats.inventoryByCategory.yarn}`);
    console.log(`     - Hooks: ${stats.inventoryByCategory.hook}`);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to load mock data:', error);
    throw error;
  }
}

/**
 * Clear specific data type from AsyncStorage
 */
export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  console.log('🗑️  User data cleared');
}

export async function clearProjects(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.PROJECTS);
  console.log('🗑️  Projects data cleared');
}

export async function clearInventory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.INVENTORY);
  console.log('🗑️  Inventory data cleared');
}

/**
 * Clear all app data from AsyncStorage
 * Uses AsyncStorage.clear() to remove ALL keys, not just known ones
 */
export async function clearAllData(): Promise<void> {
  try {
    // Clear ALL AsyncStorage keys (not just the known ones)
    await AsyncStorage.clear();
    console.log('✅ All AsyncStorage data cleared completely');
  } catch (error) {
    console.error('❌ Failed to clear data:', error);
    throw error;
  }
}

// =======================
// DATA VERIFICATION
// =======================

/**
 * Check if mock data is currently loaded
 */
export async function isMockDataLoaded(): Promise<boolean> {
  try {
    const [user, projects, inventory] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.USER),
      AsyncStorage.getItem(STORAGE_KEYS.PROJECTS),
      AsyncStorage.getItem(STORAGE_KEYS.INVENTORY),
    ]);

    return !!(user && projects && inventory);
  } catch (error) {
    console.error('Failed to check mock data status:', error);
    return false;
  }
}

/**
 * Get current data counts from AsyncStorage
 */
export async function getCurrentDataCounts(): Promise<{
  hasUser: boolean;
  projectCount: number;
  inventoryCount: number;
}> {
  try {
    const [userStr, projectsStr, inventoryStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.USER),
      AsyncStorage.getItem(STORAGE_KEYS.PROJECTS),
      AsyncStorage.getItem(STORAGE_KEYS.INVENTORY),
    ]);

    const projects = projectsStr ? JSON.parse(projectsStr) : [];
    const inventory = inventoryStr ? JSON.parse(inventoryStr) : [];

    return {
      hasUser: !!userStr,
      projectCount: Array.isArray(projects) ? projects.length : 0,
      inventoryCount: Array.isArray(inventory) ? inventory.length : 0,
    };
  } catch (error) {
    console.error('Failed to get current data counts:', error);
    return {
      hasUser: false,
      projectCount: 0,
      inventoryCount: 0,
    };
  }
}

// =======================
// DEVELOPMENT HELPERS
// =======================

/**
 * Reset app to mock data state
 * Useful for testing - clears everything and loads fresh mock data
 */
export async function resetToMockData(): Promise<void> {
  console.log('🔄 Resetting app to mock data state...');
  await loadAllMockData({ clearExisting: true });
  console.log('✅ Reset complete!');
}

/**
 * Log current storage state (for debugging)
 */
export async function logStorageState(): Promise<void> {
  const counts = await getCurrentDataCounts();
  console.log('📊 Current AsyncStorage State:');
  console.log(`   • User: ${counts.hasUser ? 'Loaded' : 'Not loaded'}`);
  console.log(`   • Projects: ${counts.projectCount} items`);
  console.log(`   • Inventory: ${counts.inventoryCount} items`);
}

// =======================
// EXPORTS
// =======================

export default {
  // Load operations
  loadMockUser,
  loadMockProjects,
  loadMockInventory,
  loadAllMockData,

  // Clear operations
  clearUser,
  clearProjects,
  clearInventory,
  clearAllData,

  // Verification
  isMockDataLoaded,
  getCurrentDataCounts,

  // Helpers
  resetToMockData,
  logStorageState,
};
