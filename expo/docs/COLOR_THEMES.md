# Color Themes - Future Roadmap

**Status:** Not implemented

---

## Current State

Single light theme in `constants/colors.ts`. All 22+ components use:
```typescript
import Colors from '@/constants/colors';
```

---

## Planned Themes

1. **Light** (current)
2. **Dark**
3. **Ocean** (blue palette)
4. **Forest** (green palette)
5. **Sunset** (warm palette)

---

## Implementation Phases

1. Create `constants/themes.ts` with ThemeColors interface
2. Create `hooks/theme-context.tsx` with system detection
3. Migrate all components to use `useTheme()` hook
4. Add theme picker to Profile screen
5. Verify WCAG 2.2 contrast for all themes

---

## Estimated Effort

6-9 hours total
