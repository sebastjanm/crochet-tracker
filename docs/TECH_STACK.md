# Tech Stack

## Core Technologies

### Framework & Runtime
- **React Native** (0.81.4): Cross-platform native mobile development
- **React** (19.1.0): UI component library
- **React DOM** (19.1.0): Web rendering support
- **Expo** (~54.0.0): Development and build toolchain
- **Expo Router** (~6.0.12): File-based routing system with type safety (MAJOR v6 update)
- **Node.js**: JavaScript runtime
- **Bun**: Fast JavaScript package manager and runtime (PRIMARY package manager)

### Language
- **TypeScript** (~5.9.2): Static type checking with strict mode enabled

### Navigation
- **Expo Router** (~6.0.12): File-based routing with type safety (MAJOR v6 with breaking changes)
- **React Navigation Native** (^7.1.6): Navigation library
- **React Native Screens** (~4.16.0): Native screen primitives
- **React Native Gesture Handler** (~2.28.0): Touch and gesture handling

## UI & Styling

### Styling
- **NativeWind** (^4.1.23): Tailwind CSS for React Native
- **React Native Web** (^0.21.0): Web compatibility

### Components
- **Lucide React Native** (0.546.0): Icon library with 1000+ icons (React 19 compatible)
- **@expo/vector-icons** (^15.0.2): Additional icon sets
- **Expo Symbols** (~1.0.7): SF Symbols for iOS
- **React Native SVG** (15.12.1): SVG rendering

### Visual Effects
- **Expo Linear Gradient** (~15.0.7): Gradient backgrounds
- **Expo Blur** (~15.0.7): Blur effects

## Media & Device Features

### Image & Camera
- **Expo Image** (~3.0.9): Optimized image component
- **Expo Image Picker** (~17.0.8): Photo/video selection from library
- **Expo Camera** (~17.0.8): Camera access and photo capture

### Audio & Video
- **Expo Audio** (^1.0.13): Audio recording and playback (NEW - preferred for audio)
- **Expo AV** (legacy): Video playback/recording (audio features moved to expo-audio)

### Haptics
- **Expo Haptics** (~15.0.7): Haptic feedback

## State Management & Data

### State Management
- **Zustand** (^5.0.2): Lightweight state management
- **@nkzw/create-context-hook** (^1.1.0): Context creation utility
- **@tanstack/react-query** (^5.83.0): Server state management

### Storage & Backend
- **@react-native-async-storage/async-storage** (2.2.0): Local data persistence
- **@supabase/supabase-js** (^2.75.1): Supabase client for authentication, database, and storage

## AI & External Services

### AI Integration
- **@google/genai** (^1.19.0): Google Generative AI SDK for AI features

## Internationalization

### i18n
- **i18n-js** (4.5.1): Internationalization framework for multi-language support

## Device & System Integration

### System APIs
- **Expo Constants** (~18.0.9): Device and app constants
- **Expo System UI** (~6.0.7): System UI configuration
- **Expo Status Bar** (~3.0.8): Status bar customization
- **Expo Splash Screen** (~31.0.10): Splash screen control
- **Expo Font** (~14.0.9): Custom font loading

### Device Features
- **Expo Location** (~19.0.7): GPS and location services
- **Expo Web Browser** (~15.0.8): In-app browser
- **Expo Linking** (~8.0.8): Deep linking support
- **Expo Navigation Bar** (~5.0.8): Android navigation bar control (NEW)
- **React Native Safe Area Context** (~5.6.0): Safe area handling
- **React Native WebView** (13.15.0): Embedded web content

## Utilities

### Polyfills & Compatibility
- **@stardazed/streams-text-encoding** (^1.0.2): Text encoding streams
- **@ungap/structured-clone** (^1.3.0): Structured clone polyfill

### Type Definitions
- **@types/react** (~19.1.10): React TypeScript types
- **@types/mime** (^4.0.0): MIME type definitions
- **mime** (^4.1.0): MIME type utilities

## Development Tools

### Build & Development
- **@expo/ngrok** (^4.1.0): Tunnel for development
- **Babel Core** (^7.25.2): JavaScript compiler

### Code Quality
- **ESLint** (^9.31.0): Linting tool
- **eslint-config-expo** (~10.0.0): Expo's ESLint configuration
- **TypeScript** (~5.9.2): Type checking

### Package Management
- **Bun** (1.3+): PRIMARY package manager - fast JavaScript runtime with excellent React 19 peer dependency handling
- 3x faster than npm/pnpm with better disk efficiency

## Configuration Files

```
├── package.json          # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── eslint.config.js     # ESLint configuration
├── app.json            # Expo configuration
├── bun.lock            # Bun lock file
└── .gitignore          # Git ignore rules
```

## Platform Support

### iOS
- Minimum iOS version: Determined by Expo SDK
- Tablet support enabled
- Camera, photo library, and microphone permissions
- Background audio support

### Android
- Adaptive icon support
- Required permissions: Camera, storage, audio recording

### Web
- React Native Web for browser compatibility
- Responsive design patterns
- PWA-ready architecture

## Architecture Patterns

- **Context + Hooks**: State management pattern
- **File-based Routing**: Automatic route generation
- **Component Composition**: Reusable UI components
- **Custom Hooks**: Shared business logic
- **Type-Safe Navigation**: Generated routes from file structure
