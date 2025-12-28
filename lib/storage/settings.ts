/**
 * App Settings Storage using AsyncStorage
 *
 * Simple key-value store for app settings and preferences.
 * Now unified with Legend-State persistence layer.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// LANGUAGE SETTINGS
// ============================================================================

const LANGUAGE_KEY = 'app_language';
const DEFAULT_LANGUAGE = 'en';

export async function getLanguage(): Promise<string> {
  try {
    const language = await AsyncStorage.getItem(LANGUAGE_KEY);
    return language ?? DEFAULT_LANGUAGE;
  } catch (error) {
    if (__DEV__) console.warn('[Settings] Failed to get language:', error);
    return DEFAULT_LANGUAGE;
  }
}

// NOTE: Sync access is no longer available with standard AsyncStorage.
// If sync access is strictly required for early init, we might need MMKV later.
// For now, consumers should await or use a default.
export function getLanguageSync(): string | null {
  return null; // AsyncStorage is async only
}

export async function setLanguage(language: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
  if (__DEV__) console.log(`[Settings] Language set to: ${language}`);
}

// ============================================================================
// ONBOARDING / FIRST RUN
// ============================================================================

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

// ============================================================================
// SYNC SETTINGS (Pro users)
// ============================================================================

const AUTO_SYNC_KEY = 'auto_sync_enabled';
const CELLULAR_SYNC_KEY = 'cellular_sync_allowed';
const LAST_SYNC_KEY = 'last_sync_timestamp';

export async function isAutoSyncEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(AUTO_SYNC_KEY);
    return value === 'true';
  } catch {
    return true;
  }
}

export async function setAutoSyncEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(AUTO_SYNC_KEY, enabled ? 'true' : 'false');
}

export async function isCellularSyncAllowed(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(CELLULAR_SYNC_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setCellularSyncAllowed(allowed: boolean): Promise<void> {
  await AsyncStorage.setItem(CELLULAR_SYNC_KEY, allowed ? 'true' : 'false');
}

export async function getLastSyncTimestamp(): Promise<Date | null> {
  try {
    const value = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return value ? new Date(value) : null;
  } catch {
    return null;
  }
}

export async function setLastSyncTimestamp(date: Date = new Date()): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNC_KEY, date.toISOString());
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

const THEME_KEY = 'app_theme';
const HAPTICS_KEY = 'haptics_enabled';
const DEFAULT_PROJECT_VIEW_KEY = 'default_project_view';

export type AppTheme = 'light' | 'dark' | 'system';
export type ProjectView = 'grid' | 'list';

export async function getTheme(): Promise<AppTheme> {
  try {
    const value = await AsyncStorage.getItem(THEME_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
    return 'system';
  } catch {
    return 'system';
  }
}

export async function setTheme(theme: AppTheme): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, theme);
}

export async function isHapticsEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(HAPTICS_KEY);
    return value !== 'false';
  } catch {
    return true;
  }
}

export async function setHapticsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(HAPTICS_KEY, enabled ? 'true' : 'false');
}

export async function getDefaultProjectView(): Promise<ProjectView> {
  try {
    const value = await AsyncStorage.getItem(DEFAULT_PROJECT_VIEW_KEY);
    return value === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

export async function setDefaultProjectView(view: ProjectView): Promise<void> {
  await AsyncStorage.setItem(DEFAULT_PROJECT_VIEW_KEY, view);
}

// ============================================================================
// GENERIC KEY-VALUE ACCESS
// ============================================================================

export async function getValue(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setValue(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function removeValue(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

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

  await AsyncStorage.multiRemove(keys);
  if (__DEV__) console.log('[Settings] All settings cleared');
}
