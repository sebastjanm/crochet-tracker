import { useEffect, useRef, useCallback, useState } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import type { EventArg } from '@react-navigation/native';

/**
 * Deep equality comparison for form state objects.
 * Handles Date objects, arrays, nested objects, and primitives.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  // Handle identical references and primitives
  if (a === b) return true;

  // Handle null/undefined
  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b;
  }

  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }
    return true;
  }

  // Different types or non-equal primitives
  return false;
}

/**
 * Normalizes form values for consistent comparison.
 * Converts empty strings to undefined, trims strings, etc.
 */
function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (typeof value === 'object') {
    const normalized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      normalized[key] = normalizeValue(val);
    }
    return normalized;
  }

  return value;
}

interface UseUnsavedChangesOptions<T> {
  /** Current form state */
  formState: T;
  /** Whether the form is in a valid state to check for changes (e.g., data loaded) */
  isReady?: boolean;
  /** Title for the discard dialog */
  dialogTitle: string;
  /** Message for the discard dialog */
  dialogMessage: string;
  /** Text for the discard button */
  discardText: string;
  /** Text for the keep editing button */
  keepEditingText: string;
  /** Callback when user confirms discard (optional, navigation happens automatically) */
  onDiscard?: () => void;
}

interface UseUnsavedChangesResult {
  /** Whether the form has unsaved changes */
  hasUnsavedChanges: boolean;
  /** Reset the initial state to current state (call after successful save) */
  resetInitialState: () => void;
  /** Manually set whether there are changes (for edge cases) */
  setHasManualChanges: (hasChanges: boolean) => void;
}

/**
 * Hook to detect unsaved form changes and prevent accidental navigation away.
 *
 * Features:
 * - Deep comparison of form state objects
 * - Handles Date objects, arrays, and nested structures
 * - Normalizes empty strings to prevent false positives
 * - Intercepts back navigation (iOS gesture, Android hardware button)
 * - Shows confirmation dialog only when real changes exist
 *
 * @example
 * ```tsx
 * const { hasUnsavedChanges, resetInitialState } = useUnsavedChanges({
 *   formState: { title, description, images, status },
 *   isReady: true,
 *   dialogTitle: t('common.unsavedChanges'),
 *   dialogMessage: t('common.discardChangesMessage'),
 *   discardText: t('common.discard'),
 *   keepEditingText: t('common.keepEditing'),
 * });
 *
 * // After successful save:
 * await saveProject();
 * resetInitialState();
 * router.dismiss();
 * ```
 */
export function useUnsavedChanges<T extends Record<string, unknown>>({
  formState,
  isReady = true,
  dialogTitle,
  dialogMessage,
  discardText,
  keepEditingText,
  onDiscard,
}: UseUnsavedChangesOptions<T>): UseUnsavedChangesResult {
  const navigation = useNavigation();
  const initialStateRef = useRef<unknown>(null);
  const isInitializedRef = useRef(false);
  const [manualChanges, setManualChanges] = useState(false);

  // Initialize the initial state when form is ready
  useEffect(() => {
    if (isReady && !isInitializedRef.current) {
      initialStateRef.current = normalizeValue(formState);
      isInitializedRef.current = true;
    }
  }, [isReady, formState]);

  // Compute whether there are unsaved changes
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!isInitializedRef.current || initialStateRef.current === null) {
      return false;
    }

    if (manualChanges) {
      return true;
    }

    const currentNormalized = normalizeValue(formState);
    return !deepEqual(initialStateRef.current, currentNormalized);
  }, [formState, manualChanges]);

  // Reset initial state to current state
  const resetInitialState = useCallback(() => {
    initialStateRef.current = normalizeValue(formState);
    setManualChanges(false);
  }, [formState]);

  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hasUnsavedChanges()) {
        Alert.alert(
          dialogTitle,
          dialogMessage,
          [
            {
              text: keepEditingText,
              style: 'cancel',
            },
            {
              text: discardText,
              style: 'destructive',
              onPress: () => {
                onDiscard?.();
                // Allow back navigation
                navigation.goBack();
              },
            },
          ]
        );
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, [hasUnsavedChanges, dialogTitle, dialogMessage, discardText, keepEditingText, onDiscard, navigation]);

  // Handle iOS swipe back and navigation events
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: EventArg<'beforeRemove', true, { action: { type: string } }>) => {
      if (!hasUnsavedChanges()) {
        // No unsaved changes, allow navigation
        return;
      }

      // Prevent default behavior (leaving the screen)
      e.preventDefault();

      // Show confirmation dialog
      Alert.alert(
        dialogTitle,
        dialogMessage,
        [
          {
            text: keepEditingText,
            style: 'cancel',
          },
          {
            text: discardText,
            style: 'destructive',
            onPress: () => {
              onDiscard?.();
              // Dispatch the action that was originally prevented
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges, dialogTitle, dialogMessage, discardText, keepEditingText, onDiscard]);

  return {
    hasUnsavedChanges: hasUnsavedChanges(),
    resetInitialState,
    setHasManualChanges: setManualChanges,
  };
}
