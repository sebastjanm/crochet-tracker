# Architecture Documentation

## Project Structure

```
crochet-tracker/
├── app/                          # Expo Router - all routes and screens
│   ├── (auth)/                  # Auth route group (login, register)
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                  # Main app tabs (protected routes)
│   │   ├── _layout.tsx          # Tab navigation configuration
│   │   ├── projects.tsx         # Projects list screen
│   │   ├── inventory.tsx        # Inventory list screen
│   │   ├── yarnai.tsx          # AI features hub
│   │   └── profile.tsx         # User profile screen
│   ├── edit-inventory/
│   │   └── [id].tsx            # Edit inventory item (dynamic route)
│   ├── edit-project/
│   │   └── [id].tsx            # Edit project (dynamic route)
│   ├── project/
│   │   └── [id].tsx            # Project detail view (dynamic route)
│   ├── yarnai/                 # YarnAI feature screens
│   │   ├── chat.tsx            # AI chat assistant
│   │   ├── ideas.tsx           # Project idea generator
│   │   ├── image-generator.tsx # AI image generation
│   │   └── voice.tsx           # Voice assistant
│   ├── help/                   # Help section screens
│   ├── legal/                  # Legal documents (terms, privacy)
│   ├── _layout.tsx             # Root layout
│   ├── index.tsx               # Landing/home screen
│   ├── add-project.tsx         # Add new project
│   ├── add-inventory.tsx       # Add new inventory item
│   ├── video-player.tsx        # Video playback screen
│   └── +not-found.tsx          # 404 error screen
│
├── components/                  # Reusable UI components
│   ├── Avatar.tsx              # User avatar component
│   ├── Button.tsx              # Custom button component
│   ├── Card.tsx                # Card component
│   ├── EmptyState.tsx          # Empty state placeholder
│   ├── ImageGallery.tsx        # Image gallery viewer
│   ├── Input.tsx               # Form input component
│   ├── ModalHeader.tsx         # Modal header component
│   └── UniversalHeader.tsx     # Screen header component
│
├── hooks/                       # Custom React hooks
│   ├── auth-context.tsx        # Authentication context and hooks
│   ├── projects-context.tsx    # Projects state management
│   ├── inventory-context.tsx   # Inventory state management
│   ├── language-context.tsx    # i18n language context
│   ├── useImagePicker.tsx      # Image picker utility hook
│   └── useInventoryHelpers.tsx # Inventory helper functions
│
├── types/                       # TypeScript type definitions
│   └── index.ts                # Main type definitions
│
├── constants/                   # App constants
│   ├── colors.ts               # Color palette
│   ├── typography.ts           # Typography styles
│   └── avatars.ts              # Avatar configurations
│
├── translations/                # i18n translation files
│   └── [language files]        # Language-specific strings
│
├── assets/                      # Static assets
│   └── images/                 # App icons and images
│
├── docs/                        # Documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── TECH_STACK.md
│   └── ARCHITECTURE.md
│
└── Configuration files
    ├── package.json
    ├── tsconfig.json
    ├── eslint.config.js
    ├── app.json
    └── README.md
```

## Architectural Patterns

### 1. File-Based Routing (Expo Router)

The app uses Expo Router's file-based routing system, which automatically generates routes from the file structure:

- **Route Groups**: `(auth)` and `(tabs)` create grouped routes without affecting URLs
- **Dynamic Routes**: `[id].tsx` files create parameterized routes
- **Layout Routes**: `_layout.tsx` files define nested layouts
- **Protected Routes**: Auth state checked in tab layout

Example routing:
```typescript
// File: app/(tabs)/projects.tsx
// Route: /projects (within tab navigation)

// File: app/project/[id].tsx
// Route: /project/123 (dynamic project ID)
```

### 2. State Management

The app uses **Context API + Custom Hooks** pattern for state management:

#### Auth Context (`hooks/auth-context.tsx`)
- Manages authentication state
- Provides login, register, logout functions
- Persists user session
- Protects routes from unauthorized access

#### Projects Context (`hooks/projects-context.tsx`)
- Manages all project CRUD operations
- Stores projects in AsyncStorage
- Provides computed values (status counts)
- Auto-syncs state with local storage

```typescript
const {
  projects,
  isLoading,
  addProject,
  updateProject,
  deleteProject,
  getProjectById,
  getProjectsByStatus,
  ideaCount,
  inProgressCount,
  completedCount,
  maybeSomedayCount,
} = useProjects();
```

#### Inventory Context (`hooks/inventory-context.tsx`)
- Manages inventory CRUD operations
- Handles yarn, hooks, and notions
- Tracks item quantities and locations
- Supports barcode scanning integration

#### Language Context (`hooks/language-context.tsx`)
- Manages app localization
- Provides translation function `t(key)`
- Supports language switching
- Persists language preference

### 3. Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Context Function (useProjects, useInventory, etc.)
    ↓
AsyncStorage Write
    ↓
Context State Update
    ↓
Re-render Components
```

### 4. Component Architecture

#### Component Hierarchy

```
Root Layout (_layout.tsx)
├── Context Providers
│   ├── AuthProvider
│   ├── ProjectsProvider
│   ├── InventoryProvider
│   └── LanguageProvider
│
└── Navigation Structure
    ├── Index Screen (Landing)
    ├── Auth Routes (login, register)
    └── Tab Navigation
        ├── Projects Tab
        ├── Inventory Tab
        ├── YarnAI Tab
        └── Profile Tab
```

#### Component Design Patterns

**Presentation Components** (`components/`)
- Pure, reusable UI components
- Accept props for customization
- No direct state management
- Examples: Button, Card, Input

**Screen Components** (`app/`)
- Route-specific components
- Use context hooks for data
- Handle user interactions
- Manage local UI state

**Custom Hooks** (`hooks/`)
- Extract reusable logic
- Provide consistent APIs
- Manage side effects
- Example: `useImagePicker`, `useInventoryHelpers`

### 5. Data Persistence

#### AsyncStorage Strategy

All data stored locally in key-value pairs:

```typescript
// Storage Keys
'projects'        → Array<Project>
'inventory'       → Array<InventoryItem>
'user'           → User
'language'       → string
'auth-token'     → string (if applicable)
```

#### Data Models

See `types/index.ts` for complete type definitions:

**Project**
```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  status: 'idea' | 'in-progress' | 'completed' | 'maybe-someday';
  images: string[];
  defaultImageIndex?: number;
  patternPdf?: string;
  inspirationUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  yarnUsed?: string[];
}
```

**InventoryItem**
```typescript
interface InventoryItem {
  id: string;
  category: 'yarn' | 'hook' | 'notion' | 'other';
  title: string;
  description: string;
  images: string[];
  quantity: number;
  minQuantity?: number;
  unit?: 'piece' | 'skein' | 'ball' | 'meter' | 'gram' | 'set';

  // Category-specific details
  yarnDetails?: YarnDetails;
  hookDetails?: HookDetails;
  notionDetails?: NotionDetails;

  // Organization
  location?: string;
  tags?: string[];

  // Project association
  usedInProjects?: string[];
  reserved?: boolean;
  reservedForProject?: string;

  // Metadata
  notes?: string;
  dateAdded: Date;
  lastUpdated: Date;
  lastUsed?: Date;
  barcode?: string;
}
```

### 6. Navigation Structure

```
App Launch
    ↓
Root Layout (Context Providers)
    ↓
Auth Check
    ↓
├─ Not Authenticated → (auth)/login
│                    → (auth)/register
│
└─ Authenticated → (tabs)/_layout
                    ↓
                    ├─ projects → /add-project
                    │          → /edit-project/[id]
                    │          → /project/[id]
                    │
                    ├─ inventory → /add-inventory
                    │           → /edit-inventory/[id]
                    │
                    ├─ yarnai → /yarnai/chat
                    │        → /yarnai/ideas
                    │        → /yarnai/image-generator
                    │        → /yarnai/voice
                    │
                    └─ profile → /help
                             → /legal/terms
                             → /legal/privacy
```

### 7. Styling System

**Design Tokens** (`constants/`)
- `colors.ts`: Centralized color palette
- `typography.ts`: Text styles and font weights

**Styling Approach**
- StyleSheet API from React Native
- Platform-specific styles with `Platform.select()`
- Consistent shadow and elevation patterns
- Responsive design with flexbox

Example color palette:
```typescript
const Colors = {
  cream: '#FAF7F0',
  deepSage: '#4A5D4F',
  deepTeal: '#2C7873',
  charcoal: '#333333',
  warmGray: '#6B6B6B',
  beige: '#E8DCC4',
  white: '#FFFFFF',
  black: '#000000',
  border: '#E0E0E0',
};
```

### 8. Type Safety

**TypeScript Configuration** (`tsconfig.json`)
- Strict mode enabled
- Path aliases: `@/*` maps to project root
- Includes Expo-generated types

**Type Generation**
- Route types auto-generated from file structure
- Type-safe navigation with `router.push()`
- Full IntelliSense support

### 9. Performance Considerations

- **Lazy Loading**: Routes loaded on-demand
- **Optimized Images**: Using Expo Image component
- **Efficient Storage**: JSON serialization for AsyncStorage
- **Memoization**: Used in computed context values
- **Gesture Handling**: Native gesture responders

### 10. Error Handling

- **Not Found Screen**: `+not-found.tsx` for invalid routes
- **Try-Catch Blocks**: In async storage operations
- **Loading States**: `isLoading` flags in contexts
- **Fallback UI**: Empty states for lists
