# Accessibility Reference

**WCAG 2.2 Level AA | Quick Reference**

---

## Color Contrast (Our Palette)

| Combination | Ratio | Status |
|-------------|-------|--------|
| Charcoal (#333) on Cream (#FAF7F0) | 11.2:1 | ✅ |
| WarmGray (#6B6B6B) on Cream | 5.8:1 | ✅ |
| White on DeepSage (#4A5D4F) | 7.8:1 | ✅ |
| White on DeepTeal (#2C7873) | 5.2:1 | ✅ |
| Terracotta (#C17767) on Cream | 3.9:1 | ⚠️ Large text only |

**Requirements:** Normal text 4.5:1 | Large text 3:1 | UI components 3:1

---

## Touch Targets

**Minimum: 44x44 points**

```typescript
// Small elements need hitSlop
<TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
  <Icon size={24} />
</TouchableOpacity>
```

---

## Screen Reader Essentials

```typescript
// Interactive elements
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Add project"
  accessibilityHint="Opens new project form"
>

// Images
<Image accessibilityLabel="Project photo" />

// Decorative (hide from screen reader)
<Image accessible={false} accessibilityLabel="" />

// Errors
<View accessibilityLiveRegion="polite" accessibilityRole="alert">
  <Text>{error}</Text>
</View>
```

---

## Testing Checklist

**Before Release:**
- [ ] VoiceOver (iOS): Settings → Accessibility → VoiceOver
- [ ] TalkBack (Android): Settings → Accessibility → TalkBack
- [ ] 200% text size (Dynamic Type)
- [ ] All buttons/links have labels
- [ ] Images have alt text or marked decorative
- [ ] Errors announced to screen reader

---

## Constants Location

`/constants/accessibility.ts` - Touch targets, multipliers, roles, colors
