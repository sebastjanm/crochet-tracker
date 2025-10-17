# Tech Stack

## Core Technologies

### Framework & Runtime
- **React Native** (0.79.1): Cross-platform native mobile development
- **React** (19.0.0): UI component library
- **React DOM** (19.0.0): Web rendering support
- **Expo** (53.0.4): Development and build toolchain
- **Expo Router** (5.0.3): File-based routing system with type safety
- **Node.js**: JavaScript runtime
- **Bun**: Fast JavaScript package manager and runtime

### Language
- **TypeScript** (5.8.3): Static type checking with strict mode enabled

### Navigation
- **Expo Router** (5.0.3): File-based routing with type safety
- **React Navigation Native** (7.1.6): Navigation library
- **React Native Screens** (4.10.0): Native screen primitives
- **React Native Gesture Handler** (2.24.0): Touch and gesture handling

## UI & Styling

### Styling
- **NativeWind** (4.1.23): Tailwind CSS for React Native
- **React Native Web** (0.20.0): Web compatibility

### Components
- **Lucide React Native** (0.475.0): Icon library with 1000+ icons
- **@expo/vector-icons** (14.1.0): Additional icon sets
- **Expo Symbols** (0.4.4): SF Symbols for iOS
- **React Native SVG** (15.11.2): SVG rendering

### Visual Effects
- **Expo Linear Gradient** (14.1.4): Gradient backgrounds
- **Expo Blur** (14.1.4): Blur effects

## Media & Device Features

### Image & Camera
- **Expo Image** (2.1.6): Optimized image component
- **Expo Image Picker** (16.1.4): Photo/video selection from library
- **Expo Camera** (16.1.11): Camera access and photo capture

### Audio & Video
- **Expo AV** (15.1.7): Audio and video playback/recording

### Haptics
- **Expo Haptics** (14.1.4): Haptic feedback

## State Management & Data

### State Management
- **Zustand** (5.0.2): Lightweight state management
- **@nkzw/create-context-hook** (1.1.0): Context creation utility
- **@tanstack/react-query** (5.83.0): Server state management

### Storage
- **@react-native-async-storage/async-storage** (2.1.2): Local data persistence

## AI & External Services

### AI Integration
- **@google/genai** (1.19.0): Google Generative AI SDK for AI features

## Internationalization

### i18n
- **i18n-js** (4.5.1): Internationalization framework for multi-language support

## Device & System Integration

### System APIs
- **Expo Constants** (17.1.4): Device and app constants
- **Expo System UI** (5.0.6): System UI configuration
- **Expo Status Bar** (2.2.3): Status bar customization
- **Expo Splash Screen** (0.30.7): Splash screen control
- **Expo Font** (13.3.0): Custom font loading

### Device Features
- **Expo Location** (18.1.4): GPS and location services
- **Expo Web Browser** (14.2.0): In-app browser
- **Expo Linking** (7.1.4): Deep linking support
- **React Native Safe Area Context** (5.3.0): Safe area handling
- **React Native WebView** (13.13.5): Embedded web content

## Utilities

### Polyfills & Compatibility
- **@stardazed/streams-text-encoding** (1.0.2): Text encoding streams
- **@ungap/structured-clone** (1.3.0): Structured clone polyfill

### Type Definitions
- **@types/react** (19.0.10): React TypeScript types
- **@types/mime** (4.0.0): MIME type definitions
- **mime** (4.1.0): MIME type utilities

## Development Tools

### Build & Development
- **@expo/ngrok** (4.1.0): Tunnel for development
- **Babel Core** (7.25.2): JavaScript compiler

### Code Quality
- **ESLint** (9.31.0): Linting tool
- **eslint-config-expo** (9.2.0): Expo's ESLint configuration
- **TypeScript** (5.8.3): Type checking

### Package Management
- **pnpm** (9+): Fast, disk space efficient package manager via Corepack
- **Bun**: Alternative runtime with fast package installation

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
