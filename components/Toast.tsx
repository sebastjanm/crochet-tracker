/**
 * Toast Notification Component
 *
 * Provides global toast notifications with:
 * - Type-specific durations (success: 1.5s, error: 4s)
 * - Swipe-to-dismiss gesture
 * - Non-blocking UI positioning
 *
 * @example
 * ```tsx
 * const { showToast } = useToast();
 * showToast('Saved!', 'success');           // Auto-dismisses in 1.5s
 * showToast('Failed to save', 'error');     // Stays 4s, swipeable
 * showToast('Custom duration', 'info', 5000); // 5s override
 * ```
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ============================================================================
// DURATION CONSTANTS (in milliseconds)
// ============================================================================

/**
 * Type-specific toast durations following UX best practices:
 * - Success: Quick feedback, user knows action completed (1.5s)
 * - Info: Informational, slightly longer to read (2.5s)
 * - Warning: Important but not critical, user should notice (3s)
 * - Error: Critical, user needs time to read/act (4s)
 */
const TOAST_DURATIONS: Record<ToastType, number> = {
  success: 1500,
  info: 2500,
  warning: 3000,
  error: 4000,
};

// Swipe threshold to dismiss (in pixels)
const SWIPE_THRESHOLD = 80;

// ============================================================================
// TYPES
// ============================================================================

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// TOAST ITEM COMPONENT
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const dismissedRef = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  }, [fadeAnim, translateY, onDismiss, toast.id]);

  // Swipe-to-dismiss with horizontal pan
  const dismissSwipe = useCallback((direction: 'left' | 'right') => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    const targetX = direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: targetX,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  }, [fadeAnim, translateX, onDismiss, toast.id]);

  // PanResponder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
        // Fade out as user swipes
        const progress = Math.min(Math.abs(gestureState.dx) / SWIPE_THRESHOLD, 1);
        fadeAnim.setValue(1 - progress * 0.5);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          // Swipe completed - dismiss
          dismissSwipe(gestureState.dx < 0 ? 'left' : 'right');
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 10,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
    ]).start();

    // Auto-dismiss timer
    const timer = setTimeout(() => {
      dismiss();
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.duration, fadeAnim, translateY, dismiss]);

  const getColors = (): { bg: string; icon: string; border: string } => {
    switch (toast.type) {
      case 'success':
        return { bg: '#ECFDF5', icon: Colors.success, border: '#A7F3D0' };
      case 'error':
        return { bg: '#FEF2F2', icon: Colors.error, border: '#FECACA' };
      case 'warning':
        return { bg: '#FFFBEB', icon: Colors.warning, border: '#FDE68A' };
      case 'info':
      default:
        return { bg: '#EFF6FF', icon: Colors.deepTeal, border: '#BFDBFE' };
    }
  };

  function ToastIcon() {
    const { icon } = getColors();
    const props = { size: 20, color: icon, strokeWidth: 2 };
    switch (toast.type) {
      case 'success':
        return <CheckCircle {...props} />;
      case 'error':
        return <AlertCircle {...props} />;
      case 'warning':
        return <AlertTriangle {...props} />;
      case 'info':
      default:
        return <Info {...props} />;
    }
  }

  const colors = getColors();

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.toast,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          opacity: fadeAnim,
          transform: [{ translateY }, { translateX }],
        },
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`${toast.type}: ${toast.message}`}
      accessibilityHint="Swipe left or right to dismiss"
    >
      <View style={styles.iconContainer}>
        <ToastIcon />
      </View>
      <Text style={styles.message} numberOfLines={2}>
        {toast.message}
      </Text>
      <TouchableOpacity
        onPress={dismiss}
        style={styles.dismissButton}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
      >
        <X size={18} color={Colors.warmGray} strokeWidth={2.5} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// TOAST PROVIDER
// ============================================================================

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      // Use type-specific duration if not explicitly provided
      const finalDuration = duration ?? TOAST_DURATIONS[type];
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type, duration: finalDuration }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/*
        Toast container positioned at top with safe area inset.
        pointerEvents="box-none" allows touches to pass through to content below.
        Individual toasts are interactive (swipeable, tappable dismiss button).
      */}
      <View
        style={[
          styles.container,
          {
            top: insets.top + (Platform.OS === 'ios' ? 10 : 20),
          },
        ]}
        pointerEvents="box-none"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
    // Ensure container doesn't block touches on underlying UI
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    width: '100%',
    maxWidth: 400,
    // Ensure toast itself captures touches for swipe gesture
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.charcoal,
    lineHeight: 20,
  },
  dismissButton: {
    marginLeft: 10,
    padding: 6,
    minWidth: 30,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ToastProvider;
