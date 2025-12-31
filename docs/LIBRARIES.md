# Libraries Overview

**Source of truth: `package.json`** - this doc is for quick categorization only.

---

## Core

| Library | Purpose |
|---------|---------|
| expo ~54 | Development platform |
| react 19.1 | UI library |
| react-native 0.81 | Mobile framework |
| expo-router ~6 | File-based navigation |
| typescript ~5.9 | Type checking |

## State & Data

| Library | Purpose |
|---------|---------|
| @legendapp/state | Reactive state + persistence |
| @supabase/supabase-js | Backend (auth, database, storage) |
| @tanstack/react-query | Server state caching |
| zustand | Simple global state |
| @react-native-async-storage/async-storage | Local storage |

## UI

| Library | Purpose |
|---------|---------|
| lucide-react-native | Icons (primary) |
| @expo/vector-icons | Additional icons |
| @shopify/flash-list | Performant lists |
| expo-image | Optimized images |
| expo-blur | Blur effects |
| expo-linear-gradient | Gradients |
| react-native-svg | SVG support |

## Device Features

| Library | Purpose |
|---------|---------|
| expo-image-picker | Photo/gallery picker |
| expo-audio | Audio recording |
| expo-haptics | Haptic feedback |
| expo-location | GPS |
| expo-web-browser | In-app browser |

## Monitoring

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
| @react-native-community/datetimepicker | Date picker |

---

**Note:** Run `bunx expo doctor` to verify version compatibility.
