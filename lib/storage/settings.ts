/**
 * App Settings Storage using expo-sqlite/kv-store
 *
 * Simple key-value store for app settings and preferences.
 * Drop-in replacement for AsyncStorage with better performance.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/sqlite/#key-value-store
 */

import Storage from 'expo-sqlite/kv-store';

// ============================================================================
// LANGUAGE SETTINGS
// ============================================================================

const LANGUAGE_KEY = 'app_language';
const DEFAULT_LANGUAGE = 'en';

/**
 * Get the current language setting.
 */
export async function getLanguage(): Promise<string> {
  try {
    const language = await Storage.getItem(LANGUAGE_KEY);
    return language ?? DEFAULT_LANGUAGE;
  } catch (error) {
    console.warn('[Settings] Failed to get language:', error);
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Get language synchronously (may return null on first access).
 */
export function getLanguageSync(): string | null {
  try {
    return Storage.getItemSync(LANGUAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Set the language preference.
 */
export async function setLanguage(language: string): Promise<void> {
  try {
    await Storage.setItem(LANGUAGE_KEY, language);
    console.log(`[Settings] Language set to: ${language}`);
  } catch (error) {
    console.error('[Settings] Failed to set language:', error);
    throw error;
  }
}

// ============================================================================
// ONBOARDING / FIRST RUN
// ============================================================================

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

/**
 * Check if user has completed onboarding.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await Storage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark onboarding as complete.
 */
export async function setOnboardingComplete(): Promise<void> {
  await Storage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

// ============================================================================
// SYNC SETTINGS (Pro users)
// ============================================================================

const AUTO_SYNC_KEY = 'auto_sync_enabled';
const CELLULAR_SYNC_KEY = 'cellular_sync_allowed';
const LAST_SYNC_KEY = 'last_sync_timestamp';

/**
 * Check if auto-sync is enabled (Pro feature).
 */
export async function isAutoSyncEnabled(): Promise<boolean> {
  try {
    const value = await Storage.getItem(AUTO_SYNC_KEY);
    return value === 'true';
  } catch {
    return true; // Default to enabled for Pro users
  }
}

/**
 * Set auto-sync preference.
 */
export async function setAutoSyncEnabled(enabled: boolean): Promise<void> {
  await Storage.setItem(AUTO_SYNC_KEY, enabled ? 'true' : 'false');
}

/**
 * Check if sync over cellular data is allowed.
 */
export async function isCellularSyncAllowed(): Promise<boolean> {
  try {
    const value = await Storage.getItem(CELLULAR_SYNC_KEY);
    return value === 'true';
  } catch {
    return false; // Default to WiFi-only
  }
}

/**
 * Set cellular sync preference.
 */
export async function setCellularSyncAllowed(allowed: boolean): Promise<void> {
  await Storage.setItem(CELLULAR_SYNC_KEY, allowed ? 'true' : 'false');
}

/**
 * Get the timestamp of the last successful sync.
 */
export async function getLastSyncTimestamp(): Promise<Date | null> {
  try {
    const value = await Storage.getItem(LAST_SYNC_KEY);
    return value ? new Date(value) : null;
  } catch {
    return null;
  }
}

/**
 * Set the last sync timestamp.
 */
export async function setLastSyncTimestamp(date: Date = new Date()): Promise<void> {
  await Storage.setItem(LAST_SYNC_KEY, date.toISOString());
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

const THEME_KEY = 'app_theme';
const HAPTICS_KEY = 'haptics_enabled';
const DEFAULT_PROJECT_VIEW_KEY = 'default_project_view';

export type AppTheme = 'light' | 'dark' | 'system';
export type ProjectView = 'grid' | 'list';

/**
 * Get the app theme preference.
 */
export async function getTheme(): Promise<AppTheme> {
  try {
    const value = await Storage.getItem(THEME_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
    return 'system';
  } catch {
    return 'system';
  }
}

/**
 * Set the app theme preference.
 */
export async function setTheme(theme: AppTheme): Promise<void> {
  await Storage.setItem(THEME_KEY, theme);
}

/**
 * Check if haptic feedback is enabled.
 */
export async function isHapticsEnabled(): Promise<boolean> {
  try {
    const value = await Storage.getItem(HAPTICS_KEY);
    return value !== 'false'; // Default to enabled
  } catch {
    return true;
  }
}

/**
 * Set haptic feedback preference.
 */
export async function setHapticsEnabled(enabled: boolean): Promise<void> {
  await Storage.setItem(HAPTICS_KEY, enabled ? 'true' : 'false');
}

/**
 * Get the default project view mode.
 */
export async function getDefaultProjectView(): Promise<ProjectView> {
  try {
    const value = await Storage.getItem(DEFAULT_PROJECT_VIEW_KEY);
    return value === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

/**
 * Set the default project view mode.
 */
export async function setDefaultProjectView(view: ProjectView): Promise<void> {
  await Storage.setItem(DEFAULT_PROJECT_VIEW_KEY, view);
}

// ============================================================================
// GENERIC KEY-VALUE ACCESS
// ============================================================================

/**
 * Get a string value by key.
 */
export async function getValue(key: string): Promise<string | null> {
  try {
    return await Storage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Set a string value by key.
 */
export async function setValue(key: string, value: string): Promise<void> {
  await Storage.setItem(key, value);
}

/**
 * Remove a value by key.
 */
export async function removeValue(key: string): Promise<void> {
  await Storage.removeItem(key);
}

/**
 * Clear all settings (use with caution).
 */
export async function clearAllSettings(): Promise<void> {
  const keys = [
    LANGUAGE_KEY,
    ONBOARDING_COMPLETE_KEY,
    AUTO_SYNC_KEY,
    CELLULAR_SYNC_KEY,
    LAST_SYNC_KEY,
    THEME_KEY,
    HAPTICS_KEY,
    DEFAULT_PROJECT_VIEW_KEY,
  ];

  await Promise.all(keys.map((key) => Storage.removeItem(key)));
  console.log('[Settings] All settings cleared');
}
