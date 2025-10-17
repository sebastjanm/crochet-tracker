# WCAG 2.2 Accessibility Compliance

**Complete Accessibility Guidelines for Crochet Tracker App**

---

## 🎯 Overview

This app MUST comply with **WCAG 2.2 Level AA** standards to ensure accessibility for all users, including those with:
- Visual impairments (low vision, color blindness, blindness)
- Motor disabilities (limited dexterity, tremors)
- Cognitive disabilities
- Hearing impairments

---

## 📋 WCAG 2.2 Principles (POUR)

### 1. **Perceivable**
Information and UI components must be presentable to users in ways they can perceive.

### 2. **Operable**
UI components and navigation must be operable.

### 3. **Understandable**
Information and UI operation must be understandable.

### 4. **Robust**
Content must be robust enough to be interpreted by assistive technologies.

---

## 🎨 Color & Contrast Requirements

### Minimum Contrast Ratios (WCAG 2.2 Level AA)

| Content Type | Minimum Ratio | Current Implementation |
|--------------|---------------|------------------------|
| Normal text (< 18pt) | **4.5:1** | ✅ Charcoal on Cream (11.2:1) |
| Large text (≥ 18pt) | **3:1** | ✅ All large text passes |
| UI components | **3:1** | ⚠️ Needs verification |
| Focus indicators | **3:1** | ❌ Not implemented |
| Graphics/icons | **3:1** | ⚠️ Needs verification |

### Color Palette Audit

```typescript
// Current colors with contrast ratios
Colors.charcoal (#333333) on Colors.cream (#FAF7F0):
  Ratio: 11.2:1 ✅ PASS (AA & AAA)

Colors.warmGray (#6B6B6B) on Colors.cream (#FAF7F0):
  Ratio: 5.8:1 ✅ PASS (AA & AAA for normal text)

Colors.terracotta (#C17767) on Colors.cream (#FAF7F0):
  Ratio: 3.9:1 ⚠️ BORDERLINE (needs testing)

Colors.white (#FFFFFF) on Colors.deepSage (#4A5D4F):
  Ratio: 7.8:1 ✅ PASS (AA & AAA)

Colors.white (#FFFFFF) on Colors.deepTeal (#2C7873):
  Ratio: 5.2:1 ✅ PASS (AA)
```

### Action Items
- ❌ Add focus indicators with 3:1 contrast
- ⚠️ Verify terracotta link color contrast
- ⚠️ Test all icon colors for 3:1 ratio
- ⚠️ Check button states (disabled, pressed)

---

## 👆 Touch Target Sizes

### WCAG 2.2 Requirement: **Minimum 44x44 points**

| Component | Current Size | Status |
|-----------|-------------|--------|
| Button (default) | 44pt height | ✅ PASS |
| Button (small) | Need to verify | ⚠️ Check |
| Tab bar icons | 26pt + padding | ⚠️ Check total |
| Links | Text only | ❌ FAIL - Add padding |
| Icon buttons | Varies | ⚠️ Check all |
| List items | 60-80pt height | ✅ PASS |

### Implementation

```typescript
// Minimum touch target
const MINIMUM_TOUCH_TARGET = 44;

// Button component already compliant
<Button /> // 44pt+ height

// Links need hitSlop or padding
<TouchableOpacity
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  accessibilityRole="link"
>
  <Text>Link text</Text>
</TouchableOpacity>
```

---

## 🔊 Screen Reader Support

### Required Attributes

Every interactive element MUST have:

```typescript
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Add new project"
  accessibilityHint="Opens form to create a new crochet project"
  accessibilityState={{ disabled: false }}
>
  <Plus size={24} />
</TouchableOpacity>
```

### Accessibility Roles

| Element | Role | Example |
|---------|------|---------|
| Button | `button` | Add project button |
| Link | `link` | Navigation links |
| Text input | `none` (automatic) | Email input field |
| Image | `image` | Project photo |
| Header | `header` | Screen title |
| Tab | `tab` | Bottom navigation |
| List | `list` | Projects list |
| List item | `none` | Individual project |
| Switch | `switch` | Toggle settings |
| Checkbox | `checkbox` | Select items |

### Labels vs Hints

```typescript
// ✅ CORRECT
accessibilityLabel="Email" // What it is
accessibilityHint="Enter your email address" // What it does

// ❌ WRONG
accessibilityLabel="Enter your email address" // Too verbose
```

### Decorative Elements

```typescript
// Hide decorative images from screen readers
<Image
  source={require('./decoration.png')}
  accessibilityLabel="" // Empty string
  accessible={false} // Not focusable
/>
```

---

## ⌨️ Keyboard Navigation (Web)

### Focus Order
- Logical tab order (left-to-right, top-to-bottom)
- No keyboard traps
- Skip navigation links for long lists

### Focus Indicators

```typescript
// Add visible focus indicators
const styles = StyleSheet.create({
  button: {
    // Normal state
  },
  buttonFocused: {
    borderWidth: 2,
    borderColor: Colors.deepTeal,
    borderStyle: 'solid',
    // Shadow for extra visibility
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});
```

### Implementation

```typescript
function AccessibleButton() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={[styles.button, isFocused && styles.buttonFocused]}
    >
      <Text>Button</Text>
    </Pressable>
  );
}
```

---

## 📝 Forms & Input Validation

### Requirements
1. **Labels**: Every input must have a visible label
2. **Required indicators**: Mark required fields clearly
3. **Error messages**: Specific, actionable feedback
4. **Error announcements**: Screen reader accessible

### Implementation

```typescript
<View>
  <Text style={styles.label}>
    Email <Text style={styles.required}>*</Text>
  </Text>
  <Input
    value={email}
    onChangeText={setEmail}
    accessibilityLabel="Email"
    accessibilityRequired={true}
    accessibilityInvalid={!!emailError}
  />
  {emailError && (
    <View
      accessible={true}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text style={styles.error}>{emailError}</Text>
    </View>
  )}
</View>
```

### Error States

```typescript
const [errors, setErrors] = useState({});

// Announce errors to screen readers
if (Object.keys(errors).length > 0) {
  AccessibilityInfo.announceForAccessibility(
    `Form has ${Object.keys(errors).length} errors. Please fix them and try again.`
  );
}
```

---

## 📖 Text & Content

### Font Scaling
Support Dynamic Type / Large Text settings:

```typescript
import { Text, Platform } from 'react-native';

// Use maxFontSizeMultiplier to prevent excessive scaling
<Text
  maxFontSizeMultiplier={2}
  style={styles.text}
>
  Content
</Text>
```

### Reading Level
- Use clear, simple language
- Avoid jargon and complex terms
- Break long paragraphs into shorter chunks
- Use headings to organize content

### Content Structure

```typescript
// Use semantic headings
<Text
  accessibilityRole="header"
  accessibilityLevel={1} // h1
  style={styles.title}
>
  Screen Title
</Text>

<Text
  accessibilityRole="header"
  accessibilityLevel={2} // h2
  style={styles.subtitle}
>
  Section Title
</Text>
```

---

## 🖼️ Images & Media

### Alternative Text

```typescript
// Informative images
<Image
  source={{ uri: project.images[0] }}
  accessibilityLabel={`${project.title} project photo showing ${project.description}`}
  accessibilityRole="image"
/>

// Decorative images
<Image
  source={require('./pattern.png')}
  accessible={false}
  accessibilityLabel=""
/>
```

### Complex Images
For charts, graphs, or detailed images:
- Provide long description in surrounding text
- Offer data table alternative
- Use `accessibilityHint` for interaction instructions

---

## 🚨 Error Prevention & Recovery

### Confirmation Dialogs

```typescript
// Destructive actions require confirmation
const deleteProject = () => {
  Alert.alert(
    'Delete Project',
    `Are you sure you want to delete "${project.title}"? This action cannot be undone.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        accessibilityLabel: 'Cancel deletion',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: handleDelete,
        accessibilityLabel: 'Confirm deletion',
      },
    ],
    {
      cancelable: true,
      accessibilityLabel: 'Delete project confirmation dialog',
    }
  );
};
```

### Undo Actions
Provide undo for destructive actions when possible:

```typescript
// Show undo snackbar after delete
showSnackbar({
  message: 'Project deleted',
  action: {
    label: 'Undo',
    onPress: restoreProject,
    accessibilityLabel: 'Undo delete project',
  },
  duration: 5000,
});
```

---

## 📱 Platform-Specific Considerations

### iOS VoiceOver
```typescript
// iOS-specific accessibility props
<View
  accessibilityTraits={['button']} // iOS only
  accessibilityViewIsModal={true} // For modals
>
```

### Android TalkBack
```typescript
// Android-specific
<View
  importantForAccessibility="yes" // Android only
  accessibilityLiveRegion="polite" // For announcements
>
```

### Cross-Platform

```typescript
// Works on both platforms
import { AccessibilityInfo } from 'react-native';

// Check if screen reader is enabled
const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

useEffect(() => {
  AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderEnabled);

  const subscription = AccessibilityInfo.addEventListener(
    'screenReaderChanged',
    setScreenReaderEnabled
  );

  return () => subscription.remove();
}, []);
```

---

## 🧪 Testing Checklist

### Automated Testing
- [ ] Run `eslint-plugin-react-native-a11y` for linting
- [ ] Use React Native Testing Library with accessibility queries
- [ ] Check color contrast with tools (WebAIM Contrast Checker)

### Manual Testing

#### iOS VoiceOver
- [ ] Enable: Settings → Accessibility → VoiceOver
- [ ] Swipe right/left to navigate
- [ ] Double-tap to activate
- [ ] Test all screens and interactions
- [ ] Verify all images have alt text
- [ ] Check form validation announcements

#### Android TalkBack
- [ ] Enable: Settings → Accessibility → TalkBack
- [ ] Swipe right/left to navigate
- [ ] Double-tap to activate
- [ ] Test all screens and interactions
- [ ] Verify focus order
- [ ] Check announcements

#### Keyboard Navigation (Web)
- [ ] Tab through all interactive elements
- [ ] Verify visible focus indicators
- [ ] Test Enter/Space to activate
- [ ] No keyboard traps
- [ ] Logical focus order

#### Visual Testing
- [ ] Test with 200% text size (Dynamic Type)
- [ ] Test in grayscale mode
- [ ] Test with color filters (protanopia, deuteranopia, tritanopia)
- [ ] Test in bright sunlight conditions
- [ ] Test with reduced motion enabled

---

## 🛠️ Development Tools

### Accessibility Inspector (iOS)
- Xcode → Open Developer Tool → Accessibility Inspector
- Inspect element hierarchy
- Run audit

### Accessibility Scanner (Android)
- Install from Play Store
- Scan app screens
- Get improvement suggestions

### Color Contrast Tools
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Color Safe: http://colorsafe.co/
- Stark (Figma plugin)

---

## 📚 Resources

### Official Guidelines
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [iOS Accessibility](https://developer.apple.com/accessibility/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)

### Testing Tools
- [Accessibility Insights](https://accessibilityinsights.io/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## 🔄 Continuous Compliance

### Pre-commit Checks
```bash
# Run accessibility linting
bun run lint:a11y

# Run accessibility tests
bun run test:a11y
```

### Code Review Checklist
- [ ] All interactive elements have accessibility labels
- [ ] Touch targets meet 44x44pt minimum
- [ ] Color contrast meets WCAG AA standards
- [ ] Forms have proper labels and error handling
- [ ] Images have alternative text (or marked decorative)
- [ ] Focus indicators are visible

### Regular Audits
- Quarterly accessibility audits
- Test with real users (including those with disabilities)
- Update documentation as standards evolve

---

**Accessibility is not optional. It's a fundamental requirement for all features.**
