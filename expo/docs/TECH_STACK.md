# Tech Stack

**Source of truth: `package.json`** - this doc is for quick reference only.

---

## Core

| Library | Purpose |
|---------|---------|
| expo ~54.0.30 | Development platform |
| react 19.1.0 | UI library |
| react-native 0.81.5 | Mobile framework |
| expo-router ~6.0.21 | File-based navigation (v6) |
| typescript ~5.9.2 | Type checking |
| bun 1.3+ | Package manager (PRIMARY) |

## State & Data

| Library | Purpose |
|---------|---------|
| @legendapp/state | Reactive state + persistence |
| zustand | Simple global state |
| @tanstack/react-query | Server state caching |
| @supabase/supabase-js | Backend (auth, database, storage) |
| @react-native-async-storage/async-storage | Local storage |

## UI Components

| Library | Purpose |
|---------|---------|
| @shopify/flash-list | Performant lists |
| lucide-react-native | Icons (primary) |
| @expo/vector-icons | Additional icons |
| react-native-svg | SVG support |
| expo-blur | Blur effects |
| expo-linear-gradient | Gradients |

## Media & Images

| Library | Purpose |
|---------|---------|
| expo-image | Optimized images |
| expo-image-picker | Photo/gallery picker |
| expo-image-manipulator | Image processing |
| expo-audio | Audio recording |

## Device Features

| Library | Purpose |
|---------|---------|
| expo-haptics | Haptic feedback |
| expo-location | GPS |
| expo-network | Network state |
| expo-web-browser | In-app browser |
| @react-native-community/datetimepicker | Date picker |

## System

| Library | Purpose |
|---------|---------|
| expo-constants | Device constants |
| expo-splash-screen | Splash screen |
| expo-status-bar | Status bar |
| expo-navigation-bar | Android nav bar |
| react-native-safe-area-context | Safe areas |

## Monitoring & Updates

| Library | Purpose |
|---------|---------|
| @sentry/react-native | Error tracking |
| expo-updates | OTA updates |

## Utilities

| Library | Purpose |
|---------|---------|
| i18n-js | Internationalization |
| @google/genai | AI features |
| uuid | ID generation |

---

**Note:** Run `bunx expo doctor` to verify version compatibility.
