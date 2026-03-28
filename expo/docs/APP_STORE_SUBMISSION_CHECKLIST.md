# App Store Submission Checklist

**Artful Space Crochet Tracker**
**Version:** 1.0.0 | **Last Updated:** January 6, 2026

This document provides a comprehensive checklist for submitting the app to the Apple App Store and Google Play Store.

---

## Table of Contents

1. [Pre-Submission Requirements](#pre-submission-requirements)
2. [Code & Security Checklist](#code--security-checklist)
3. [EAS Configuration](#eas-configuration)
4. [App Store Connect (iOS)](#app-store-connect-ios)
5. [Google Play Console (Android)](#google-play-console-android)
6. [Screenshots & Graphics](#screenshots--graphics)
7. [Build & Test](#build--test)
8. [Submission Day Checklist](#submission-day-checklist)
9. [Post-Submission](#post-submission)
10. [Common Rejection Reasons](#common-rejection-reasons)

---

## Pre-Submission Requirements

### Developer Accounts

| Platform | Account | Cost | URL |
|----------|---------|------|-----|
| iOS | Apple Developer Program | $99/year | [developer.apple.com](https://developer.apple.com) |
| Android | Google Play Developer | $25 one-time | [play.google.com/console](https://play.google.com/console) |

### Required Assets

- [ ] App icon (1024x1024 PNG, no alpha)
- [ ] Screenshots for all required device sizes
- [ ] Feature graphic (Android: 1024x500)
- [ ] Privacy Policy URL (publicly accessible)
- [ ] Terms of Service URL (optional but recommended)
- [ ] Support URL or email

---

## Code & Security Checklist

### API Key Security

- [ ] **Rotate any exposed API keys** (check git history)
  ```bash
  # Check for exposed secrets in git history
  git log -p --all -S 'sk-' --source -- '*.ts' '*.json' '*.env*'
  ```

- [ ] **Environment variables properly configured**
  - Use `EXPO_PUBLIC_` prefix for client-side variables
  - Store sensitive keys in EAS Secrets only
  - Never commit `.env` files (should be in `.gitignore`)

- [ ] **Verify EAS Secrets are set**
  ```bash
  eas secret:list
  ```

### App Store Compliance

- [ ] **Account deletion** - Apple requires in-app account deletion option
- [ ] **Privacy links** - Show Privacy Policy & Terms on registration screen
- [ ] **No debug code** - All `console.log` wrapped in `__DEV__` guards
- [ ] **HTTPS only** - All network requests use HTTPS
- [ ] **Proper permissions** - Only request permissions that are used
- [ ] **Permission descriptions** - Clear usage descriptions for camera, microphone, photos

### Code Quality

- [ ] **Lint passes**: `bun run lint`
- [ ] **TypeScript compiles**: `bunx tsc --noEmit`
- [ ] **Expo doctor passes**: `bunx expo doctor`
- [ ] **No crashes** - Test all user flows on both platforms

---

## EAS Configuration

### eas.json Structure

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "env": {
        "SENTRY_AUTH_TOKEN": "@sentry_auth_token"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Required EAS Secrets

```bash
# Create secrets for production builds
eas secret:create SENTRY_AUTH_TOKEN --value "your-sentry-token"
eas secret:create EXPO_PUBLIC_OPENAI_API_KEY --value "sk-..."
eas secret:create EXPO_PUBLIC_SUPABASE_URL --value "https://..."
eas secret:create EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
```

### Google Play Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable "Google Play Android Developer API"
4. Create Service Account with "Service Account User" role
5. Download JSON key file
6. In Google Play Console → Users & Permissions → Invite user
7. Add service account email with "Release manager" permission
8. Save JSON as `google-service-account.json` (add to `.gitignore`!)

**Guide:** [EAS Submit Android Docs](https://docs.expo.dev/submit/android/#creating-a-google-service-account)

---

## App Store Connect (iOS)

### App Information

| Field | Value | Max Length |
|-------|-------|------------|
| App Name | Artful Space - Crochet Tracker | 30 chars |
| Subtitle | Organize Yarn & Projects | 30 chars |
| Category | Lifestyle (Primary), Productivity (Secondary) | - |
| Content Rights | Does not contain third-party content | - |

### Version Information

| Field | Requirements |
|-------|--------------|
| Description | 4000 chars max, compelling copy |
| Keywords | 100 chars max, comma-separated |
| Support URL | Required, publicly accessible |
| Marketing URL | Optional |
| Privacy Policy URL | Required |

### App Review Information

- [ ] **Demo account credentials** (if login required)
  - Email: `reviewer@artful.space`
  - Password: [secure password]
- [ ] **Contact information** for App Review team
- [ ] **Notes for reviewer** - Explain any non-obvious features

### Age Rating Questionnaire

| Question | Answer |
|----------|--------|
| Violence | None |
| Sexual Content | None |
| Profanity | None |
| Drugs/Alcohol | None |
| Gambling | None |
| Horror/Fear | None |
| User-Generated Content | Yes (photos) |
| Unrestricted Web Access | No |

**Expected Rating:** 4+

---

## Google Play Console (Android)

### Store Listing

| Field | Value | Max Length |
|-------|-------|------------|
| App Name | Artful Space - Crochet & Yarn Tracker | 50 chars |
| Short Description | Track crochet projects, yarn stash & tools with AI | 80 chars |
| Full Description | Same as iOS, formatted for Play Store | 4000 chars |
| Category | Lifestyle | - |

### Content Rating (IARC)

Complete the questionnaire covering:
- Violence
- Sexuality
- Language
- Controlled substances
- User interaction
- Location data usage
- Camera/Microphone usage

**Expected Rating:** Everyone

### Data Safety Form

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Email address | Yes | No | Account authentication |
| Name | Yes | No | Personalization |
| Photos | Yes | No | Project images |
| Device info | Yes | No | Error tracking |
| App interactions | Yes | No | Analytics |

**Security Practices:**
- Data encrypted in transit: Yes
- Users can request data deletion: Yes
- Follows GDPR: Yes

---

## Screenshots & Graphics

### iOS Screenshot Requirements

| Device | Size (pixels) | Count |
|--------|---------------|-------|
| iPhone 6.7" (15 Pro Max) | 1290 x 2796 | 5-10 |
| iPhone 6.5" (11 Pro Max) | 1242 x 2688 | 5-10 |
| iPhone 5.5" (8 Plus) | 1242 x 2208 | 5-10 |
| iPad Pro 12.9" (6th gen) | 2048 x 2732 | 5-10 |

### Android Screenshot Requirements

| Device | Size (pixels) | Count |
|--------|---------------|-------|
| Phone | 1080 x 1920 min | 2-8 |
| 7" Tablet | 1200 x 1920 | 2-8 (optional) |
| 10" Tablet | 1920 x 1200 | 2-8 (optional) |

### Feature Graphic (Android Only)

- **Size:** 1024 x 500 pixels
- **Format:** PNG or JPEG
- Include app name and relevant imagery
- Follow brand colors
- No excessive text

### Recommended Screens to Capture

1. Landing/Welcome screen
2. Projects list (with sample data)
3. Project detail view
4. Inventory management
5. AI chat feature
6. Voice assistant
7. Profile/Settings

### Localization

If supporting multiple languages (en, sl, de, ru), create localized screenshots for each:
- Change device language before capturing
- Or use screenshot framing tools with translated text overlays

---

## Build & Test

### Create Production Builds

```bash
# Build for both platforms
eas build --platform all --profile production

# Or build individually
eas build --platform ios --profile production
eas build --platform android --profile production

# Check build status
eas build:list
```

### Testing Checklist

#### Core Functionality
- [ ] User registration
- [ ] User login
- [ ] Password reset
- [ ] Account deletion
- [ ] Create project
- [ ] Edit project
- [ ] Delete project
- [ ] Add inventory item
- [ ] Edit inventory item
- [ ] Delete inventory item
- [ ] AI chat feature
- [ ] Voice assistant
- [ ] Image capture/upload
- [ ] Profile settings
- [ ] Language switching

#### Permissions
- [ ] Camera permission request
- [ ] Photo library permission request
- [ ] Microphone permission request
- [ ] Permission denial handling

#### Edge Cases
- [ ] No network connection
- [ ] Slow network
- [ ] Empty states (no projects/inventory)
- [ ] Long text handling
- [ ] Large image uploads
- [ ] Background/foreground transitions

---

## Submission Day Checklist

### iOS Submission

1. [ ] All screenshots uploaded (5+ per device size)
2. [ ] App description filled in
3. [ ] Keywords entered (100 chars max)
4. [ ] Privacy policy URL verified working
5. [ ] Support URL verified working
6. [ ] Age rating completed
7. [ ] Demo credentials entered (if required)
8. [ ] App Review notes added
9. [ ] Build uploaded and processed
10. [ ] Select build for review
11. [ ] Submit for review

### Android Submission

1. [ ] Feature graphic uploaded (1024x500)
2. [ ] All screenshots uploaded (2+ minimum)
3. [ ] Short description filled in (80 chars)
4. [ ] Full description filled in
5. [ ] Data Safety form completed
6. [ ] Content rating completed
7. [ ] Privacy policy URL verified
8. [ ] AAB uploaded and processed
9. [ ] Create release in Production track
10. [ ] Review and rollout release

### Quick Submit Commands

```bash
# Submit to both stores (after builds complete)
eas submit --platform all --latest

# Or submit individually
eas submit --platform ios --latest
eas submit --platform android --latest
```

---

## Post-Submission

### Review Timeline

| Platform | Typical Review Time |
|----------|-------------------|
| iOS | 24-48 hours |
| Android | 2-7 days |

### If Rejected

1. **Read rejection message carefully**
2. **Don't argue** - fix the issue
3. **Contact App Review** if unclear (iOS)
4. **Resubmit promptly** - review times may be faster for resubmissions

### After Approval

- [ ] Verify app appears in store
- [ ] Test download and installation
- [ ] Monitor crash reports (Sentry)
- [ ] Respond to user reviews
- [ ] Plan next update

---

## Common Rejection Reasons

### iOS

1. **Guideline 2.1** - App Completeness: Crashes, placeholders, or incomplete features
2. **Guideline 2.3** - Accurate Metadata: Screenshots don't match app
3. **Guideline 4.2** - Minimum Functionality: App doesn't provide enough value
4. **Guideline 5.1.1** - Data Collection: Missing privacy policy or unclear data usage
5. **Guideline 5.1.2** - Data Use and Sharing: Not disclosing third-party analytics

### Android

1. **Policy violation** - Data safety declaration doesn't match app behavior
2. **Broken functionality** - Features don't work as described
3. **Deceptive behavior** - App does something not disclosed in listing
4. **Restricted content** - Inappropriate content

### Prevention Tips

- Test thoroughly on real devices
- Keep descriptions accurate
- Be transparent about data collection
- Don't over-promise features
- Respond quickly to reviewer questions

---

## Resources

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Screenshot Specs](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications)
- [Play Store Asset Requirements](https://support.google.com/googleplay/android-developer/answer/9866151)

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-06 | 1.0.0 | Initial checklist created |
