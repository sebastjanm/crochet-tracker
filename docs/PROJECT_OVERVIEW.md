# Artful Space Crochet Tracker - Project Overview

## Description

Artful Space Crochet Tracker is a native cross-platform mobile application designed to help crochet enthusiasts manage their projects, inventory (yarn, hooks, and notions), and leverage AI-powered features for inspiration and assistance. The app is built with React Native and Expo, making it available for iOS, Android, and web platforms.

## Project Information

- **Name**: Artful Space Crochet Tracker
- **Package**: `expo-app`
- **Version**: 1.0.0
- **Platform**: Native iOS & Android, exportable to web
- **Bundle ID (iOS)**: `app.rork.artful-space-crochet-tracker`
- **Package (Android)**: `app.rork.artful-space-crochet-tracker`

## Development Platform

This project was created using [Rork](https://rork.com), an AI-powered mobile app builder that generates production-ready React Native applications. The codebase is fully accessible and can be developed locally using standard React Native/Expo tooling.

## Key Features

### 1. Project Management
- Create and track crochet projects with multiple statuses:
  - Ideas
  - In Progress
  - Completed
  - Maybe Someday
- Attach multiple images to projects
- Store pattern PDFs and inspiration URLs
- Add detailed notes and track yarn used
- Project editing and deletion

### 2. Inventory Management
- Comprehensive inventory system with three main categories:
  - **Yarn**: Track brand, weight, composition, color, gauge, care instructions
  - **Hooks**: Manage hook sizes, materials, ergonomic features
  - **Notions**: Store information about stitch markers, scissors, needles, gauges, etc.
- Barcode/UPC scanning support
- Multiple images per inventory item
- Quantity tracking with low-stock alerts
- Location and tag-based organization
- Project association tracking
- Reserve items for specific projects

### 3. YarnAI - AI-Powered Features
A suite of AI tools to assist with crochet projects:

**Active Features:**
- **Chat Assistant**: AI-powered conversational help for crochet questions and guidance
- **Image Generator**: Create visual inspiration for projects
- **Project Ideas**: Generate creative project ideas based on preferences
- **Voice Assistant**: Voice-enabled AI interaction

**Coming Soon:**
- Pattern Search: AI-powered pattern discovery and recommendations

### 4. User Profile & Authentication
- User registration and login system
- Profile management with customizable avatars
- Secure authentication flow

### 5. Internationalization (i18n)
- Multi-language support with i18n-js
- Localized strings throughout the application
- Language context provider for easy translation access

## Technical Highlights

- **File-based Routing**: Uses Expo Router for intuitive navigation
- **Offline-First**: Local data persistence with AsyncStorage
- **Responsive Design**: Adaptive UI for different screen sizes
- **Platform-Specific UI**: Optimized experiences for iOS, Android, and web
- **Modern React**: Built with React 19.0 and React Native 0.79.1
- **Type Safety**: Full TypeScript implementation with strict mode
- **State Management**: Context API for global state (projects, inventory, auth, language)
- **Image Handling**: Advanced image picking and camera integration
- **Media Support**: Video playback and audio recording capabilities

## User Experience

The app features a clean, artisan-inspired design with a cream, sage, and teal color palette. The interface uses a bottom tab navigation with four main sections:

1. **Projects** (Volleyball icon)
2. **Inventory** (Box icon)
3. **YarnAI** (Sparkles icon)
4. **Profile** (User icon)

Each screen includes contextual help buttons and follows consistent design patterns with card-based layouts, shadows, and smooth animations.

## Data Storage

All user data is stored locally on the device using AsyncStorage, ensuring:
- Privacy: No data sent to external servers (except AI features)
- Offline functionality: Full app functionality without internet
- Fast performance: Immediate data access
- Data ownership: Users control their own data

## Development Philosophy

The codebase follows modern React Native best practices:
- Component-driven architecture
- Separation of concerns (UI, business logic, data)
- Reusable custom components
- Custom hooks for shared functionality
- Context providers for state management
- TypeScript for type safety
