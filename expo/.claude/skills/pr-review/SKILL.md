---
name: pr-review
description: Review pull requests for code quality, TypeScript safety, accessibility (WCAG 2.2), and Expo/React Native best practices. Use when reviewing PRs, checking code changes, or analyzing diffs.
allowed-tools: Read, Grep, Glob, Bash
---

# Pull Request Review

Review PRs against the Artful Space Crochet Tracker coding standards.

## Instructions

When reviewing a PR, follow this process:

### 1. Understand the Changes

```bash
git diff origin/main...HEAD --stat
git diff origin/main...HEAD
git log origin/main...HEAD --oneline
```

### 2. Run Quality Checks

```bash
bun run lint
bunx tsc --noEmit
bunx expo doctor
```

### 3. Review Against Standards

Check each category and report findings:

## Code Quality Checklist

### TypeScript (Strict Mode)
- [ ] No `any` types
- [ ] No `@ts-ignore` or `@ts-expect-error`
- [ ] Proper interface definitions for props
- [ ] Explicit return types on exported functions

### Component Patterns
- [ ] Function declarations (not arrow functions) for components
- [ ] Props interfaces named `ComponentNameProps`
- [ ] StyleSheet.create for all styles (no inline styles)
- [ ] Proper import order (React → Expo → External → Internal → Types)

### Expo Router 6 Patterns
- [ ] Root layout uses `<Slot />` for providers
- [ ] Nested layouts include `<Stack.Screen>` children
- [ ] Tab layouts explicitly define `<Tabs.Screen>`
- [ ] Group routes use parentheses `(auth)`, `(tabs)`

### State Management
- [ ] Context API with `@nkzw/create-context-hook`
- [ ] AsyncStorage for persistence with try/catch
- [ ] Proper cleanup in useEffect hooks
- [ ] No state mutations

### Accessibility (WCAG 2.2 Level AA)
- [ ] Color contrast: 4.5:1 for normal text, 3:1 for large text
- [ ] Touch targets: minimum 44x44 points
- [ ] All interactive elements have `accessibilityLabel`
- [ ] Form inputs have proper error announcements
- [ ] Images have `accessibilityLabel` or `accessible={false}`

### Performance
- [ ] FlatList with proper keyExtractor and optimization props
- [ ] Memoization for expensive components/calculations
- [ ] expo-image instead of Image for remote images
- [ ] No console.log in production (wrap in `__DEV__`)

### Security
- [ ] No exposed API keys
- [ ] Input validation on user data
- [ ] HTTPS for all network requests
- [ ] Sensitive data in expo-secure-store (not AsyncStorage)

### Styling
- [ ] Uses Colors from `@/constants/colors`
- [ ] Uses Typography from `@/constants/typography`
- [ ] Platform-specific shadows with `Platform.select`
- [ ] Consistent spacing and border radius

### i18n
- [ ] All user-facing strings use `t()` from useLanguage
- [ ] Translation keys added to all language files (en, sl, de, ru)

## Output Format

Provide feedback in this structure:

### Summary
Brief overview of the changes and overall assessment.

### Issues Found
List each issue with:
- **File**: `path/to/file.tsx:lineNumber`
- **Severity**: Critical / Warning / Suggestion
- **Issue**: Description
- **Fix**: How to resolve it

### Passing Checks
List standards that are properly followed.

### Recommendations
Optional improvements that would enhance the code.

## Example Review

```markdown
### Summary
This PR adds a new inventory filter component. Generally well-structured but has accessibility gaps.

### Issues Found

1. **File**: `components/InventoryFilter.tsx:45`
   - **Severity**: Critical
   - **Issue**: Missing accessibilityLabel on filter button
   - **Fix**: Add `accessibilityLabel="Filter inventory items"`

2. **File**: `components/InventoryFilter.tsx:23`
   - **Severity**: Warning
   - **Issue**: Inline style `style={{ padding: 10 }}`
   - **Fix**: Move to StyleSheet.create

### Passing Checks
- TypeScript strict mode compliance
- Proper component structure
- Correct import order

### Recommendations
- Consider memoizing the filter options array
- Add haptic feedback on filter selection
```
