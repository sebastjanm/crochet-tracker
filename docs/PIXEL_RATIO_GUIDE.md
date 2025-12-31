# Pixel Density Normalization

Ensures consistent borders/shadows across devices (iPhone 3x, Android 2x, etc.)

---

## Quick Reference

```typescript
import {
  normalizeBorder,
  normalizeBorderOpacity,
  cardShadow,
  buttonShadow,
  modalShadow
} from '@/constants/pixelRatio';
```

| Function | Use For |
|----------|---------|
| `normalizeBorder(0.5)` | Thin borders |
| `normalizeBorderOpacity(0.04)` | Border color alpha |
| `cardShadow` | Card shadows |
| `buttonShadow` | FAB/button shadows |
| `modalShadow` | Modal shadows |

---

## Usage

```typescript
const styles = StyleSheet.create({
  card: {
    borderWidth: normalizeBorder(0.5),
    borderColor: `rgba(0, 0, 0, ${normalizeBorderOpacity(0.1)})`,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
});
```

---

## Critical Fix: iOS Shadow Clipping

iOS shadows get clipped by `overflow: 'hidden'`.

```typescript
// ❌ WRONG - shadow clipped
<View style={{ borderRadius: 16, overflow: 'hidden', shadowOpacity: 0.5 }}>
  <LinearGradient />
</View>

// ✅ CORRECT - move overflow to inner element
<View style={{ borderRadius: 16, shadowOpacity: 0.5 }}>
  <LinearGradient style={{ borderRadius: 16, overflow: 'hidden' }} />
</View>
```

---

## Critical Fix: Badge Clipping

Badge text clips on high-density screens. Fix with explicit height:

```typescript
badge: {
  height: 26,           // Fixed height
  overflow: 'visible',  // Prevent clipping
  minWidth: 28,
}
```

---

**Source:** `/constants/pixelRatio.ts`
