# Production-Grade Code Audit Checklist

**Systematic checklist for bringing React Native/Expo code to production standards.**

*Last Updated: 2025-12-28 | Expo SDK 54 | React Native 0.81 | React 19*

---

## Core Principles

### Do's
- **Use Expo SDK 54**: OTA updates, managed native code, simplified workflow
- **FlashList over FlatList**: 5-10x faster rendering for lists (Shopify benchmark)
- **expo-image over Image**: Built-in caching, blur placeholder, memory optimization
- **Use Reanimated**: 60fps animations via native thread worklets
- **Legend-State Observables**: Fine-grained reactivity, automatic persistence
- **Supabase RLS**: Row Level Security on ALL tables - never trust client
- **Test on real devices**: Simulators miss memory pressure, thermal throttling, network conditions
- **Tree shake imports**: Use ESM named imports, avoid barrel exports

### Don'ts
- **Don't inline styles**: Use `StyleSheet.create` for bridge optimization
- **Don't fetch in render**: Use `useEffect`, React Query, or Legend-State sync
- **Don't ignore platform differences**: Test iOS AND Android before every commit
- **Don't store secrets in code**: Use `EXPO_PUBLIC_` env vars + Supabase secrets
- **Don't skip error boundaries**: Mobile crashes lose user trust permanently
- **Don't mutate state directly**: Use Legend-State's `.set()`, `.assign()`, `.delete()`
- **Don't use `var` or `require()`**: Breaks tree shaking, use `const` + ESM imports
- **Don't use `console.log` in production**: Wrap in `if (__DEV__)`

---

## Quick Reference Links

| Topic | Documentation |
|-------|---------------|
| **Expo LLM Index** | https://docs.expo.dev/llms.txt |
| **React Native LLM Index** | https://reactnative.dev/llms.txt |
| Expo SDK 54 | https://docs.expo.dev/versions/latest/ |
| Expo Router 6 | https://docs.expo.dev/router/introduction/ |
| React Native Performance | https://reactnative.dev/docs/performance |
| FlashList | https://shopify.github.io/flash-list/ |
| Legend-State v3 | https://legendapp.com/open-source/state/v3/ |
| Supabase RN Guide | https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native |
| WCAG 2.2 Quick Ref | https://www.w3.org/WAI/WCAG22/quickref/ |

> **Tip:** The LLM Index files (`llms.txt`) are AI-optimized documentation indexes. Fetch them for comprehensive, up-to-date information on any Expo or React Native topic.

---

## Pre-Audit Commands

```bash
# MUST pass before committing
bun run lint              # ESLint check
bunx tsc --noEmit         # TypeScript strict mode
bunx expo doctor          # Expo project health

# Debug tools
# Press 'j' in Expo CLI for Chrome DevTools
# Enable "Highlight re-renders" in React DevTools
```

---

## Per-File Audit Checklist

Copy this checklist for each file you audit:

### File: `_______________`

---

### 1. IMPORTS

- [ ] **Remove unused `React` import** (React 19 JSX transform)
  ```typescript
  // ❌ import React, { useState } from 'react';
  // ✅ import { useState } from 'react';
  ```

- [ ] **Remove all unused named imports**
  - Common culprits: `Platform`, `Dimensions`, `StyleSheet` (if no styles)

- [ ] **Use ESM imports for tree shaking**
  ```typescript
  // ❌ import _ from 'lodash';
  // ✅ import { debounce } from 'lodash-es';

  // ❌ import * as Icons from 'lucide-react-native';
  // ✅ import { Home, Settings } from 'lucide-react-native';
  ```

- [ ] **Add missing hooks**: `useMemo`, `useCallback` if needed

- [ ] **Verify import order**:
  1. React/RN core (`react`, `react-native`)
  2. Expo packages (`expo-router`, `expo-image`)
  3. External libs (`@tanstack/react-query`)
  4. Internal `@/` imports
  5. Types (always last)

---

### 2. COMPONENT DECLARATION

- [ ] **Function declaration** (hoisting, debugging)
  ```typescript
  // ❌ export const Screen = () => {}
  // ✅ export default function Screen() {}
  ```

- [ ] **JSDoc comment with purpose**
  ```typescript
  /**
   * ProjectsScreen - Displays user's crochet projects with filtering.
   * Supports search, status filters, and pull-to-refresh.
   */
  ```

- [ ] **Return type annotation**
  ```typescript
  export default function Screen(): React.JSX.Element {
  ```

---

### 3. PERFORMANCE (Lists)

- [ ] **Use FlashList for 10+ items**
  ```typescript
  // ❌ <FlatList data={items} />
  // ✅ <FlashList data={items} estimatedItemSize={100} />
  ```

- [ ] **FlatList optimization props** (if FlatList required)
  ```typescript
  <FlatList
    removeClippedSubviews={true}
    maxToRenderPerBatch={10}
    windowSize={5}
    initialNumToRender={10}
    getItemLayout={(_, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    })}
  />
  ```

- [ ] **Memoize renderItem**
  ```typescript
  const renderItem = useCallback(({ item }) => (
    <ItemCard item={item} onPress={handlePress} />
  ), [handlePress]);
  ```

---

### 4. PERFORMANCE (Memoization)

- [ ] **Memoize filtered/sorted data**
  ```typescript
  const filteredItems = useMemo(() =>
    items.filter(item => item.status === filter),
  [items, filter]);
  ```

- [ ] **Memoize computed arrays** (filters, tabs, menu items)
  ```typescript
  const tabs = useMemo(() => [
    { id: 'all', label: t('tabs.all') },
    { id: 'active', label: t('tabs.active') },
  ], [t]);
  ```

- [ ] **Wrap event handlers with useCallback**
  ```typescript
  const handlePress = useCallback((id: string) => {
    router.push(`/project/${id}`);
  }, []);
  ```

- [ ] **Wrap functions passed as props**
  ```typescript
  const onRefresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);
  ```

---

### 5. PERFORMANCE (Images)

- [ ] **Use expo-image** (not RN Image)
  ```typescript
  import { Image } from 'expo-image';

  <Image
    source={{ uri: imageUrl }}
    style={styles.image}
    contentFit="cover"
    transition={200}
    cachePolicy="memory-disk"
    recyclingKey={item.id}  // Important for lists
  />
  ```

- [ ] **Provide placeholder for loading states**
  ```typescript
  <Image
    source={{ uri: imageUrl }}
    placeholder={blurhash}
    placeholderContentFit="cover"
  />
  ```

---

### 6. LEGEND-STATE & DATA SAFETY

- [ ] **Selector fallbacks** (handle undefined before hydration)
  ```typescript
  // ❌ const data = useSelector(() => store$.get())
  // ✅ const data = useSelector(() => store$.get() ?? [])
  ```

- [ ] **Never copy Observable to useState**
  ```typescript
  // ❌ const [item, setItem] = useState(getItemById(id));
  // ✅ const item = getItemById(id);  // Always reactive
  ```

- [ ] **Use proper mutation methods**
  ```typescript
  // ❌ items[id] = newValue;
  // ✅ items$[id].set(newValue);
  // ✅ items$[id].assign({ status: 'completed' });
  // ✅ items$[id].delete();
  ```

- [ ] **Sync activation before mutations**
  ```typescript
  // For persisted stores, ensure sync is active
  if (!items$.peek()) {
    await when(items$);  // Wait for hydration
  }
  items$[id].assign(changes);
  ```

- [ ] **Image URL validation**
  ```typescript
  // ❌ source={{ uri: item.image }}
  // ✅ source={getImageSource(item.image)}
  ```

---

### 7. SUPABASE BEST PRACTICES

- [ ] **Always handle errors**
  ```typescript
  const { data, error } = await supabase.from('projects').select();
  if (error) {
    if (__DEV__) console.error('Fetch failed:', error);
    throw new Error(error.message);
  }
  ```

- [ ] **Clean up realtime subscriptions**
  ```typescript
  useEffect(() => {
    const channel = supabase.channel('projects')
      .on('postgres_changes', { ... }, handler)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  ```

- [ ] **Use RLS, never trust client filters alone**
  ```sql
  -- Server-side enforcement
  CREATE POLICY "Users see own data"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);
  ```

- [ ] **Batch operations for performance**
  ```typescript
  // ❌ Multiple single inserts
  // ✅ Single batch insert
  const { error } = await supabase.from('items').insert(itemsArray);
  ```

---

### 8. ERROR BOUNDARIES & ASYNC

- [ ] **Try/Catch all async operations**
  ```typescript
  try {
    await someAsyncAction();
  } catch (error) {
    if (__DEV__) console.error('Action failed:', error);
    Alert.alert(t('errors.generic'));
  }
  ```

- [ ] **Guard ALL console statements**
  ```typescript
  // ❌ console.log('Debug:', data);
  // ✅ if (__DEV__) console.log('Debug:', data);
  ```

- [ ] **No module-level console.log**
  ```typescript
  // ❌ At top of file:
  // console.log('Module loaded');

  // ✅ Only inside functions, guarded:
  // if (__DEV__) console.log('Function called');
  ```

---

### 9. STYLES CLEANUP

- [ ] **Find unused styles**
  ```bash
  # For each style name in StyleSheet.create
  grep -n "styles.NAME" FILE
  ```

- [ ] **Delete all unused styles**

- [ ] **No inline styles**
  ```typescript
  // ❌ style={{ padding: 16 }}
  // ✅ style={styles.container}
  ```

- [ ] **No commented-out styles**

- [ ] **Platform-specific shadows**
  ```typescript
  ...Platform.select({
    ios: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  ```

---

### 10. TYPESCRIPT

- [ ] **No `any` types**
  ```typescript
  // ❌ const data: any = ...
  // ❌ as any
  // ✅ Use proper types or unknown + type guards
  ```

- [ ] **Fix unused catch variables**
  ```typescript
  // ❌ catch (error) { Alert.alert('Error'); }
  // ✅ catch { Alert.alert('Error'); }
  ```

- [ ] **Proper router typing**
  ```typescript
  router.push(path as Parameters<typeof router.push>[0]);
  ```

- [ ] **Strict null checks**
  ```typescript
  // ❌ item.name.toLowerCase()
  // ✅ item.name?.toLowerCase() ?? ''
  ```

---

### 11. ACCESSIBILITY (WCAG 2.2 Level AA)

- [ ] **accessibilityLabel** on all interactive elements
  ```typescript
  accessibilityLabel="Add new project"
  ```

- [ ] **accessibilityRole** for semantics
  ```typescript
  accessibilityRole="button"  // or "link", "header", "image"
  ```

- [ ] **accessibilityHint** for non-obvious actions
  ```typescript
  accessibilityHint="Opens the project creation form"
  ```

- [ ] **44pt minimum touch targets**
  ```typescript
  { minWidth: 44, minHeight: 44 }
  ```

- [ ] **Color contrast** (4.5:1 normal text, 3:1 large text)

- [ ] **accessibilityState** for dynamic states
  ```typescript
  accessibilityState={{ disabled: isLoading, selected: isActive }}
  ```

---

### 12. DEAD CODE

- [ ] **Remove unused variables**

- [ ] **Remove unused functions**

- [ ] **Remove TODO comments** (create GitHub issues instead)

- [ ] **Remove "maybe later" code**

- [ ] **Remove unused imports** (caught by lint, but verify)

---

### 13. FINAL VERIFICATION

```bash
# All must pass
bun run lint
bunx tsc --noEmit

# Manual grep checks
grep "console\." FILE | grep -v "__DEV__"   # No unguarded console
grep ": any" FILE                            # No any types
grep "as any" FILE                           # No any casts
grep 'style={{' FILE                         # No inline styles
grep "import React" FILE                     # No React import (React 19)
```

---

## Animation Performance (Reanimated)

For 60fps animations, use Reanimated worklets:

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function AnimatedCard() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPressIn={handlePressIn}>
        {/* content */}
      </Pressable>
    </Animated.View>
  );
}
```

**Key rules:**
- Use `useSharedValue` instead of `Animated.Value`
- Use `useAnimatedStyle` for style transformations
- Run logic in worklets (`'worklet'` directive) for native thread
- Never read `.value` in render (causes re-render)

---

## Debugging Tools

### Chrome DevTools (Press 'j' in Expo CLI)
- **Performance tab**: Record and analyze frame drops
- **React DevTools**: Enable "Highlight updates" to spot unnecessary re-renders
- **Network tab**: Monitor API calls and payload sizes

### React Native Debugger
```bash
# Install
brew install react-native-debugger

# Launch before starting Expo
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

### Expo DevTools
- Shake device or press 'm' in terminal
- "Debug Remote JS" for breakpoints
- "Performance Monitor" for FPS/memory

---

## Files Audit Status

| File | Audited | Date | Styles |
|------|---------|------|--------|
| `app/(tabs)/_layout.tsx` | ✅ | 2025-12-28 | 4 |
| `app/(tabs)/projects.tsx` | ✅ | 2025-12-28 | 35 |
| `app/(tabs)/inventory.tsx` | ✅ | 2025-12-28 | 21 |
| `app/(tabs)/tools.tsx` | ✅ | 2025-12-28 | 23 |
| `app/(tabs)/profile.tsx` | ✅ | 2025-12-28 | 46 |
| `app/(auth)/_layout.tsx` | ✅ | 2025-12-28 | 0 |
| `app/(auth)/login.tsx` | ✅ | 2025-12-28 | 18 |
| `app/(auth)/register.tsx` | ✅ | 2025-12-28 | 17 |
| `app/(auth)/forgot-password.tsx` | ✅ | 2025-12-28 | 15 |
| `app/_layout.tsx` | ⬜ | - | - |
| `app/add-project.tsx` | ⬜ | - | - |
| `app/add-inventory.tsx` | ⬜ | - | - |
| `app/edit-inventory/[id].tsx` | ✅ | 2025-12-28 | 30 |
| `app/edit-project/[id].tsx` | ✅ | 2025-12-28 | 22 |
| `app/project/[id].tsx` | ✅ | 2025-12-28 | 78 |
| `app/inventory/[id].tsx` | ⬜ | - | - |
| `components/Button.tsx` | ⬜ | - | - |
| `components/Input.tsx` | ⬜ | - | - |
| `components/Card.tsx` | ⬜ | - | - |
| `hooks/auth-context.tsx` | ⬜ | - | - |
| `hooks/projects-context.tsx` | ⬜ | - | - |
| `hooks/inventory-context.tsx` | ⬜ | - | - |

---

## Priority Order

1. **Screens** (`app/`) - User-facing, highest impact
2. **Components** (`components/`) - Reused everywhere, multiplied bugs
3. **Hooks/Contexts** (`hooks/`) - Business logic, data integrity
4. **Utils** (`lib/`, `scripts/`) - Support code, lower priority

---

## Quick Commands

```bash
# Find all files with inline styles
grep -rn 'style={{' app/ components/

# Find all unguarded console.log
grep -rn 'console\.' app/ components/ hooks/ | grep -v '__DEV__'

# Find all any types
grep -rn ': any' app/ components/ hooks/ types/

# Count styles per file
for f in app/**/*.tsx; do
  count=$(grep -c "StyleSheet.create" "$f" 2>/dev/null || echo 0)
  if [ "$count" -gt 0 ]; then
    styles=$(grep -A 1000 "StyleSheet.create" "$f" | grep -c ":" || echo 0)
    echo "$f: ~$styles styles"
  fi
done
```

---

*Standards: CLAUDE.md + WCAG 2.2 Level AA + Expo/RN/Legend-State/Supabase Best Practices*
