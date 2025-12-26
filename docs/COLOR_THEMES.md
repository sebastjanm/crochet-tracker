# Color Themes Implementation Guide

**Status:** Planned for future implementation
**Effort:** ~6-9 hours across sessions
**Priority:** Soon

---

## Current Architecture

### Color Constants (`constants/colors.ts`)

Single light-only palette organized into categories:
- **Backgrounds:** white, ivory, cream, linen, beige, headerBg
- **Text:** charcoal (primary), warmGray (secondary), softGray (tertiary)
- **Primary Actions:** sage, deepSage
- **Secondary Actions:** teal, deepTeal
- **Status:** error, success, warning, terracotta
- **Filter Chips:** todo, inProgress, onHold, completed, archived, frogged

### Current Usage Pattern

```typescript
// All 22 components use this pattern:
import Colors from '@/constants/colors';

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.cream },
  text: { color: Colors.charcoal },
});
```

### Files Using Colors

**Components (22):**
- Avatar, AvatarPickerModal, Button, Card, DatePicker
- EmptyState, FullscreenImageModal, ImageGallery, Input
- LockedProFeature, MaterialCardSelector, MaterialPickerModal
- ModalHeader, MultiSelect, ProjectLinksSummary
- ProjectSelectorModal, ProjectTypeBadge, SectionHeader
- SectionHeaderWithAdd, Select, SelectedMaterialsPreview
- UniversalHeader

**Layouts (6):**
- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(auth)/_layout.tsx`
- `app/help/_layout.tsx`
- `app/yarnai/_layout.tsx`
- `app/legal/_layout.tsx`

---

## Proposed Architecture: Multiple Themes

### Theme Structure (`constants/themes.ts`)

```typescript
export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceSecondary: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Brand/Primary
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Accent/Secondary
  accent: string;
  accentDark: string;

  // Status
  error: string;
  success: string;
  warning: string;

  // UI
  border: string;
  shadow: string;
  overlay: string;

  // Tab bar
  tabActive: string;
  tabInactive: string;
}

export const themes: Record<string, ThemeColors> = {
  light: {
    background: '#FAF7F0',      // cream
    backgroundSecondary: '#F5F0E6',
    surface: '#FFFFFF',
    textPrimary: '#333333',     // charcoal
    textSecondary: '#6B6B6B',   // warmGray
    primary: '#8B9A7B',         // sage
    primaryDark: '#4A5D4F',     // deepSage
    accent: '#2C7873',          // deepTeal
    // ... rest of colors
  },

  dark: {
    background: '#1A1A1A',
    backgroundSecondary: '#2D2D2D',
    surface: '#3D3D3D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    primary: '#A4B494',         // lighter sage
    primaryDark: '#8B9A7B',
    accent: '#4ECDC4',          // brighter teal
    // ... rest of colors
  },

  ocean: {
    background: '#EDF6F9',
    surface: '#FFFFFF',
    textPrimary: '#1B4965',
    primary: '#5FA8D3',
    accent: '#62B6CB',
    // ... ocean palette
  },

  forest: {
    background: '#F0F4F0',
    surface: '#FFFFFF',
    textPrimary: '#2D3E2F',
    primary: '#4A7C59',
    accent: '#8CB369',
    // ... forest palette
  },

  sunset: {
    background: '#FFF8F0',
    surface: '#FFFFFF',
    textPrimary: '#5C4033',
    primary: '#E07A5F',
    accent: '#F2CC8F',
    // ... warm sunset palette
  },
};
```

### Theme Context (`hooks/theme-context.tsx`)

```typescript
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { themes, ThemeColors } from '@/constants/themes';

type ThemeName = 'light' | 'dark' | 'ocean' | 'forest' | 'sunset' | 'system';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemScheme = useColorScheme();
  const [themeName, setThemeName] = useState<ThemeName>('system');

  useEffect(() => {
    AsyncStorage.getItem('theme').then(saved => {
      if (saved) setThemeName(saved as ThemeName);
    });
  }, []);

  const setTheme = async (name: ThemeName) => {
    setThemeName(name);
    await AsyncStorage.setItem('theme', name);
  };

  const resolvedTheme = themeName === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : themeName;

  const colors = themes[resolvedTheme];
  const isDark = resolvedTheme === 'dark';

  return { colors, themeName, resolvedTheme, isDark, setTheme };
});
```

### Component Migration Pattern

**Before:**
```typescript
import Colors from '@/constants/colors';

export function Card({ children }: Props) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.linen,
    borderColor: Colors.border,
  },
});
```

**After:**
```typescript
import { useTheme } from '@/hooks/theme-context';

export function Card({ children }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  return <View style={styles.container}>{children}</View>;
}

const useStyles = (colors: ThemeColors) => useMemo(() =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
  }), [colors]);
```

---

## Implementation Phases

### Phase 1: Infrastructure (1-2 hours)

1. **Create `constants/themes.ts`**
   - Define ThemeColors interface
   - Create 5 theme palettes: light, dark, ocean, forest, sunset

2. **Create `hooks/theme-context.tsx`**
   - Theme provider with system detection
   - AsyncStorage persistence
   - setTheme function

3. **Update `app/_layout.tsx`**
   - Add ThemeProvider to provider stack
   - Update SystemUI.setBackgroundColorAsync to use theme

### Phase 2: Component Migration (3-4 hours)

Refactor all 22 components to use `useTheme()`:
- Replace `import Colors` with `useTheme()`
- Convert static styles to dynamic styles
- Use `useMemo` for performance

### Phase 3: Layout Updates (1 hour)

Update all 6 layout files:
- Tab bar colors
- Header backgrounds
- StatusBar style based on theme

### Phase 4: Theme Picker UI (1 hour)

Add to Profile screen:
- Theme selector with visual previews
- "Follow System" option
- Immediate preview on selection

### Phase 5: Polish (1-2 hours)

- Test all screens in all themes
- Verify accessibility contrast ratios
- Add smooth theme transition animations

---

## Accessibility Considerations

Each theme must meet WCAG 2.2 Level AA:
- **Normal text:** 4.5:1 contrast ratio minimum
- **Large text:** 3:1 contrast ratio minimum
- **UI components:** 3:1 contrast ratio minimum

Add contrast audit for each theme in `constants/accessibility.ts`.

---

## Migration Checklist

```
[ ] Create constants/themes.ts
[ ] Create hooks/theme-context.tsx
[ ] Update app/_layout.tsx with ThemeProvider

Components:
[ ] Avatar.tsx
[ ] AvatarPickerModal.tsx
[ ] Button.tsx
[ ] Card.tsx
[ ] DatePicker.tsx
[ ] EmptyState.tsx
[ ] FullscreenImageModal.tsx
[ ] ImageGallery.tsx
[ ] Input.tsx
[ ] LockedProFeature.tsx
[ ] MaterialCardSelector.tsx
[ ] MaterialPickerModal.tsx
[ ] ModalHeader.tsx
[ ] MultiSelect.tsx
[ ] ProjectLinksSummary.tsx
[ ] ProjectSelectorModal.tsx
[ ] ProjectTypeBadge.tsx
[ ] SectionHeader.tsx
[ ] SectionHeaderWithAdd.tsx
[ ] Select.tsx
[ ] SelectedMaterialsPreview.tsx
[ ] UniversalHeader.tsx

Layouts:
[ ] app/_layout.tsx
[ ] app/(tabs)/_layout.tsx
[ ] app/(auth)/_layout.tsx
[ ] app/help/_layout.tsx
[ ] app/yarnai/_layout.tsx
[ ] app/legal/_layout.tsx

[ ] Add Theme Picker to Profile
[ ] Test all themes
[ ] Verify accessibility
```

---

## Resources

- [React Native useColorScheme](https://reactnative.dev/docs/usecolorscheme)
- [WCAG 2.2 Contrast Requirements](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- Current color file: `constants/colors.ts`
- Accessibility file: `constants/accessibility.ts`
