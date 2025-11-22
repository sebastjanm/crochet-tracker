# Pixel Density Normalization Guide

## Overview

This project uses pixel density normalization to ensure consistent visual appearance across devices with different screen densities (iPhone, Android, tablets).

## Why This Matters

Different devices have different pixel densities:
- **iPhone 13 Pro**: ~3x pixel ratio (458 PPI - very high density)
- **Google Pixel 9**: ~2.6x pixel ratio (422 PPI)
- **Samsung A13**: ~2x pixel ratio (270 PPI - standard density)

Without normalization, the same UI element will appear:
- **Too thick/heavy** on high-density screens (borders, shadows)
- **Too thin/light** on low-density screens

## Real-World Tuning

The normalization factors have been tuned based on actual device testing:

### Borders
- **iPhone (3x)**: Uses **1.5x** multiplier (50% thicker, balanced with 4x opacity)
- **Pixel (2.6x)**: Uses **0.75x** multiplier (perfect)
- **Samsung (2x)**: Uses **0.8x** multiplier (good balance)

### Shadows
- **iPhone (3x)**:
  - Shadow opacity: **0.12** (2x base of 0.06 - visible but subtle)
  - Shadow offset: **3px** (from 2px - slight depth increase)
  - Shadow radius: **10px** (from 8px - slightly softer)
  - Elevation: **2** (moderate increase)
  - Custom shadows: **2x** multiplier on base opacity
- **Pixel (2.6x)**: Base opacity (0.06), offset 2px, radius 8px, elevation 1
- **Samsung (2x)**: Base opacity (0.06), offset 2px, radius 8px, elevation 1

**Critical Finding:** High-density iPhone screens require **MODERATELY THICKER** borders (1.5x = +50%) and **MUCH STRONGER COLOR OPACITY** (4x) than theoretical calculations suggest. The extreme pixel density (458 PPI) makes standard UI elements invisible without opacity compensation.

### Border Color Opacity (THE REAL ISSUE!)

The border **width** is only half the problem. The border **color opacity** is equally critical:

- **iPhone (3x)**: Border colors need **4x opacity**
  - `rgba(0, 0, 0, 0.04)` becomes `rgba(0, 0, 0, 0.16)` on iPhone
  - Even a thick border is invisible if it's only 4% opacity!
- **Pixel & Samsung**: Base opacity unchanged

**Use the `normalizeBorderOpacity()` function:**
```typescript
borderColor: `rgba(0, 0, 0, ${normalizeBorderOpacity(0.04)})`
```

This was the missing piece! Borders were thick but invisible because the color was too transparent.

### iOS Shadow Rendering Issue (CRITICAL!)

**iOS shadows get CLIPPED by `overflow: 'hidden'` and appear as borders instead of proper drop shadows!**

**Wrong approach:**
```typescript
// ❌ Shadow gets clipped and looks like a border
<View style={{ borderRadius: 16, overflow: 'hidden', shadowOpacity: 0.5 }}>
  <LinearGradient />
</View>
```

**Correct approach:**
```typescript
// ✅ Shadow renders properly as 3D effect
<View style={{ borderRadius: 16, shadowOpacity: 0.5 }}>
  <LinearGradient style={{ borderRadius: 16, overflow: 'hidden' }} />
</View>
```

**Key fix:** Move `overflow: 'hidden'` to the INNER container (gradient), keep rounded corners on OUTER container for shadows to render properly.

## Implementation

### 1. Import the Utilities

```typescript
import {
  normalizeBorder,
  cardShadow,
  modalShadow,
  buttonShadow,
  normalizeCustomShadow
} from '@/constants/pixelRatio';
```

### 2. Use for Borders

**Before:**
```typescript
const styles = StyleSheet.create({
  card: {
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
});
```

**After:**
```typescript
const styles = StyleSheet.create({
  card: {
    borderWidth: normalizeBorder(0.5),
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
});
```

### 3. Use for Shadows

**Before:**
```typescript
const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
```

**After (Simple):**
```typescript
const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      ...cardShadow,  // Pre-configured normalized shadow
      default: {},
    }),
  },
});
```

**After (Custom):**
```typescript
const styles = StyleSheet.create({
  customElement: {
    ...Platform.select({
      ...normalizeCustomShadow({
        color: Colors.black,
        baseOpacity: 0.1,
        radius: 12,
        offsetHeight: 4,
        baseElevation: 3,
      }),
      default: {},
    }),
  },
});
```

## Pre-configured Shadow Presets

### 1. `cardShadow`
Subtle shadow for card components throughout the app.
- **iOS**: shadowOpacity 0.06-0.08, radius 8
- **Android**: elevation 1-1.5

**Use for:** Card components, list items, subtle elevated surfaces

```typescript
...Platform.select({
  ...cardShadow,
  default: {},
})
```

### 2. `modalShadow`
More prominent shadow for elevated modals and dialogs.
- **iOS**: shadowOpacity 0.15-0.20, radius 16
- **Android**: elevation 4-6

**Use for:** Modals, dialogs, bottom sheets, prominent overlays

```typescript
...Platform.select({
  ...modalShadow,
  default: {},
})
```

### 3. `buttonShadow`
Shadow for floating action buttons and prominent CTAs.
- **iOS**: shadowOpacity 0.12-0.16, radius 12
- **Android**: elevation 3-4.5

**Use for:** Floating action buttons, primary buttons, prominent CTAs

```typescript
...Platform.select({
  ...buttonShadow,
  default: {},
})
```

## Applying to Existing Components

### Example: Projects Screen Card

**File:** `app/(tabs)/projects.tsx`

```typescript
import { normalizeBorder, cardShadow } from '@/constants/pixelRatio';

const styles = StyleSheet.create({
  projectCard: {
    borderRadius: 16,
    borderWidth: normalizeBorder(0.5),
    borderColor: 'rgba(0, 0, 0, 0.1)',
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
});
```

### Example: Button Component

**File:** `components/Button.tsx`

```typescript
import { normalizeBorder, buttonShadow } from '@/constants/pixelRatio';

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.deepTeal,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
});
```

### Example: Modal Header

**File:** `components/ModalHeader.tsx`

```typescript
import { normalizeBorder, modalShadow } from '@/constants/pixelRatio';

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: normalizeBorder(0.5),
    borderBottomColor: Colors.border,
    ...Platform.select({
      ...modalShadow,
      default: {},
    }),
  },
});
```

## Advanced Usage

### Custom Shadow with Specific Parameters

```typescript
import { normalizeCustomShadow } from '@/constants/pixelRatio';

const customShadow = normalizeCustomShadow({
  color: '#FF0000',        // Custom shadow color
  baseOpacity: 0.2,        // Base opacity (adjusted for density)
  radius: 20,              // Shadow radius
  offsetHeight: 6,         // Shadow offset height
  baseElevation: 5,        // Android elevation (adjusted for density)
});

const styles = StyleSheet.create({
  specialElement: {
    ...Platform.select({
      ...customShadow,
      default: {},
    }),
  },
});
```

### Checking Device Density

```typescript
import { getPixelRatio, isHighDensity, isMediumDensity } from '@/constants/pixelRatio';

// Get exact pixel ratio
const ratio = getPixelRatio(); // 1, 2, 3, etc.

// Check density category
if (isHighDensity()) {
  // iPhone 13 Pro, Pixel 9, etc.
  console.log('High-density device (3x+)');
}

if (isMediumDensity()) {
  // Samsung A13, most Android devices
  console.log('Medium-density device (2x-3x)');
}
```

## Migration Checklist

To apply pixel density normalization to a component:

- [ ] Import utilities: `import { normalizeBorder, cardShadow } from '@/constants/pixelRatio';`
- [ ] Replace `borderWidth: 0.5` with `borderWidth: normalizeBorder(0.5)`
- [ ] Replace `borderWidth: 1` with `borderWidth: normalizeBorder(1)`
- [ ] Replace manual shadow/elevation with preset or custom shadow
- [ ] Test on multiple devices (iOS, Android, different densities)
- [ ] Verify visual consistency across platforms

## Files That Need Updates

### High Priority (User-facing screens)
- [ ] `app/(tabs)/projects.tsx` - Project cards
- [ ] `app/(tabs)/inventory.tsx` - Inventory cards
- [ ] `app/(tabs)/profile.tsx` - Profile cards
- [x] `app/(tabs)/tools.tsx` - ✅ Already updated
- [ ] `app/project/[id].tsx` - Project detail cards
- [ ] `app/add-project.tsx` - Form inputs

### Medium Priority (Components)
- [ ] `components/Button.tsx` - Button borders and shadows
- [ ] `components/Card.tsx` - Card borders and shadows
- [ ] `components/Input.tsx` - Input field borders
- [ ] `components/ModalHeader.tsx` - Modal borders
- [ ] `components/EmptyState.tsx` - Container borders

### Low Priority (Special screens)
- [ ] `app/(auth)/login.tsx` - Auth forms
- [ ] `app/(auth)/register.tsx` - Auth forms
- [ ] Help screens
- [ ] Legal screens

## Testing

After applying normalization, test on:

1. **iPhone 13 Pro** (3x density) - Verify borders aren't too thin
2. **Google Pixel 9** (2.6x density) - Verify balanced appearance
3. **Samsung A13** (2x density) - Verify borders aren't too thick
4. **iPad** (2x density) - Verify tablet layout consistency

## Official Documentation

- [Expo Pixel Ratio Guide](https://docs.expo.dev/versions/latest/sdk/captureRef/#note-on-pixel-values)
- [React Native PixelRatio API](https://reactnative.dev/docs/pixelratio)
- [React Native Platform-Specific Code](https://reactnative.dev/docs/platform-specific-code)

## Best Practices

1. **Always use normalization for borders < 2px**
   - `normalizeBorder(0.5)`, `normalizeBorder(1)` - YES
   - `normalizeBorder(4)` - Usually unnecessary

2. **Use shadow presets when possible**
   - Keeps consistency across the app
   - Easier to maintain
   - Already tested and optimized

3. **Custom shadows only when needed**
   - Special design requirements
   - Unique visual hierarchy
   - Brand-specific styling

4. **Test on real devices**
   - Simulators may not accurately represent pixel density
   - Test on both iOS and Android
   - Include various screen sizes

## Troubleshooting

### Borders appear too thin on some devices
- Check if you're using `normalizeBorder()` - it may be over-adjusting
- Try using the raw value for thicker borders (> 2px)

### Shadows look different on iOS vs Android
- This is expected - different rendering engines
- Use presets (`cardShadow`, `modalShadow`, `buttonShadow`) for consistency
- Adjust `baseOpacity` and `baseElevation` in `normalizeCustomShadow` if needed

### Elements still look inconsistent
- Verify you're using the same preset/normalization across similar elements
- Check for hardcoded shadow values elsewhere in the codebase
- Ensure you're testing on devices with different pixel ratios

### Badge numbers clipping or text cut off
**CRITICAL: Common issue with category filter badges and count badges**

**Symptoms:**
- Numbers appear partially hidden/clipped
- Text is cut off at bottom
- Only visible on specific devices (especially iPhone 13 Pro)
- Happens when badge state changes (active/inactive)

**Root Causes:**
1. **Missing explicit height** - Text can overflow container
2. **Missing `overflow: 'visible'`** - Container clips the text
3. **Bold font weight change** - Active state uses heavier font that needs more space
4. **FlatList layout interference** - Content below can trigger badge re-layout

**Solutions:**

```typescript
// ✅ CORRECT - Badge count with explicit dimensions
categoryCount: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  minWidth: 28,
  height: 26,              // ← CRITICAL: Fixed height
  overflow: 'visible',     // ← CRITICAL: Prevent clipping
  fontSize: 13,
  lineHeight: 18,
  textAlign: 'center',
}

// ✅ CORRECT - Active state must also have same dimensions
categoryCountActive: {
  fontWeight: '600',       // Bolder font needs same space
  height: 26,              // ← CRITICAL: Same as non-active
  overflow: 'visible',     // ← CRITICAL: Same as non-active
  paddingHorizontal: 10,
  paddingVertical: 4,
  minWidth: 28,
}
```

**Badge Section Layout Isolation:**

To prevent FlatList/ScrollView content changes from affecting badges:

```typescript
// ✅ CORRECT - Badges in separate wrapper, outside content container
<SafeAreaView> (header) </SafeAreaView>

<View style={styles.filterWrapper}>  // ← Isolated wrapper
  <ScrollView horizontal>
    {badges}
  </ScrollView>
</View>

<View style={styles.container}>      // ← Separate content container
  <FlatList key={filter} />          // ← key forces clean remount
</View>

// Styles
filterWrapper: {
  backgroundColor: Colors.filterBar,  // Filter bar background (#ded8ca)
  marginTop: 0,                       // No gap for tight design
}
```

**Why isolation matters:**
- FlatList height changes (2 cards → 3 cards) can trigger parent re-layout
- On high pixel density displays (iPhone 13 Pro 3x), this causes visible badge jumping
- Separating badges into their own wrapper prevents layout propagation
- Adding `key={filter}` to FlatList forces clean remount instead of diff-based updates

**Testing checklist:**
- [ ] Test badge with single-digit numbers (1-9)
- [ ] Test badge with double-digit numbers (10+)
- [ ] Click badge to activate (check bold font rendering)
- [ ] Click another badge (check previous badge deactivation)
- [ ] Switch between filters with different item counts (2 vs 3+ items)
- [ ] Test on iPhone 13 Pro (3x density)
- [ ] Test on Samsung/Android (2x density)
- [ ] Verify no jumping when FlatList content changes

---

**Last Updated:** 2025-01-17
**Module Location:** `/constants/pixelRatio.ts`
**Example Implementation:** `/app/(tabs)/tools.tsx`, `/app/(tabs)/inventory.tsx`, `/app/(tabs)/projects.tsx`
