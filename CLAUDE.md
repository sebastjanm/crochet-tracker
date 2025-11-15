# CLAUDE.md

**Production-Grade Mobile Development Specification**
**Artful Space Crochet Tracker - Expo SDK 54 | React Native 0.81 | React 19**

This document defines mandatory coding standards for AI-assisted React Native/Expo development. Every rule is enforceable and must be followed without exception.

---

## 📚 MANDATORY DOCUMENTATION - ALWAYS CONSULT FIRST

**ALWAYS check official docs before implementing. These are the authoritative sources:**

1. **[Expo SDK 54 Docs](https://docs.expo.dev/versions/latest/)** - PRIMARY platform reference
2. **[Expo Router 6](https://docs.expo.dev/router/introduction/)** - Navigation & routing (MAJOR changes from v5)
3. **[React Native 0.81](https://reactnative.dev/docs/getting-started)** - Core framework
4. **[React 19](https://react.dev/)** - Latest React features
5. **[TypeScript 5.9](https://www.typescriptlang.org/docs/)** - Type system
6. **[Bun](https://bun.sh/docs)** - Package manager & runtime
7. **[Zustand](https://github.com/pmndrs/zustand)** - State management
8. **[TanStack Query v5](https://tanstack.com/query/latest)** - Server state
9. **[Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)** - Icons
10. **[i18n-js](https://github.com/fnando/i18n)** - Internationalization
11. **[Google Generative AI](https://ai.google.dev/)** - AI features

---

## 🔴 CORE PRINCIPLES

1. **Documentation First**: ALWAYS consult official docs above before implementing
2. **Zero Errors**: Code MUST pass `bun run lint`, TypeScript checks, and `bunx expo doctor`
3. **Type Safety**: NO `any`, NO `@ts-ignore`, NO `//@ts-expect-error`
4. **Accessibility First**: MUST comply with **WCAG 2.2 Level AA** (see Accessibility section)
5. **Mobile-First**: Test on iOS AND Android before committing
6. **Performance**: App launch < 2s, 60fps animations, optimized re-renders
7. **Clean Code**: Well-documented, maintainable, idiomatic patterns

---

## 🚨 CRITICAL PRE-COMMIT CHECKLIST

**ALWAYS run before committing:**

```bash
bun run lint              # Must pass with zero errors
bunx tsc --noEmit         # TypeScript check
bunx expo doctor          # Expo project health
# Test on both platforms
```

---

## 💎 TECH STACK (LATEST & GREATEST)

### Core Framework

```yaml
Runtime: Node.js 22+ LTS
Package Manager: Bun 1.3+ (PRIMARY - NOT npm, NOT pnpm)
Framework: React Native 0.81.4
Platform: Expo SDK ~54.0.0 (managed workflow)
Library: React 19.1.0 (latest with new features)
Language: TypeScript ~5.9.2 (strict mode)
Navigation: Expo Router ~6.0.12 (file-based, major v6 changes)
```

**Why Bun?**
- 🚀 3x faster than npm/pnpm
- ✅ Better React 19 peer dependency handling
- 💾 Smaller disk footprint
- 🔧 Built-in TypeScript execution

### State & Data Management

```yaml
Local State: useState, useReducer
Global State: Zustand ^5.0.2 (lightweight, <1KB)
Context: React Context API (auth, projects, inventory, language)
Context Helper: @nkzw/create-context-hook ^1.1.0
Server State: @tanstack/react-query ^5.83.0 (for Supabase data)
Backend: Supabase (PostgreSQL, Auth, Storage)
Supabase Client: @supabase/supabase-js ^2.75.1
Session Storage: @react-native-async-storage/async-storage 2.2.0
Internationalization: i18n-js ^4.5.1
```

### UI, Styling & Media

```yaml
Styling: React Native StyleSheet API (PRIMARY)
         NativeWind ^4.1.23 (Tailwind for RN - optional)
Icons: lucide-react-native 0.546.0 (React 19 compatible)
Vector Icons: @expo/vector-icons ^15.0.2
SF Symbols: expo-symbols ~1.0.7 (iOS)
Images: expo-image ~3.0.9 (optimized, cached)
Camera: expo-camera ~17.0.8
Image Picker: expo-image-picker ~17.0.8
Audio: expo-audio ^1.0.13 (NEW - replaces deprecated expo-av)
Video: expo-av (legacy for video only)
Gestures: react-native-gesture-handler ~2.28.0
Safe Areas: react-native-safe-area-context ~5.6.0
SVG: react-native-svg 15.12.1
Gradients: expo-linear-gradient ~15.0.7
Blur: expo-blur ~15.0.7
```

### Device Features

```yaml
Location: expo-location ~19.0.7
Haptics: expo-haptics ~15.0.7
Web Browser: expo-web-browser ~15.0.8
Linking: expo-linking ~8.0.8
Status Bar: expo-status-bar ~3.0.8
System UI: expo-system-ui ~6.0.7
Splash Screen: expo-splash-screen ~31.0.10
Constants: expo-constants ~18.0.9
Fonts: expo-font ~14.0.9
Navigation Bar: expo-navigation-bar ~5.0.8 (Android)
```

### AI & External Services

```yaml
AI: @google/genai ^1.19.0 (Google Generative AI)
Platform: Rork integration for development workflow
```

### Development Tools

```yaml
Linting: ESLint ^9.31.0 + eslint-config-expo ~10.0.0
Bundler: Metro (included with Expo)
Build: EAS Build (when ready for deployment)
Updates: EAS Update (over-the-air updates)
Tunnel: @expo/ngrok ^4.1.0 (development)
TypeScript: ~5.9.2 (strict mode)
Babel: @babel/core ^7.25.2
```

---

## 📁 PROJECT STRUCTURE (ACTUAL)

```
crochet-tracker/
├── app/                          # Expo Router 6 - File-based routing
│   ├── _layout.tsx              # ROOT layout - uses <Slot /> for providers
│   ├── index.tsx                # Landing/splash screen
│   │
│   ├── (auth)/                  # Auth group (hidden from URLs)
│   │   ├── _layout.tsx          # Auth stack with <Stack.Screen> children
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   │
│   ├── (tabs)/                  # Main app tabs (protected)
│   │   ├── _layout.tsx          # Tab navigator with Tabs.Screen
│   │   ├── projects.tsx         # Projects list
│   │   ├── inventory.tsx        # Inventory management
│   │   ├── yarnai.tsx           # AI features hub
│   │   └── profile.tsx          # User profile
│   │
│   ├── help/                    # Help section
│   │   ├── _layout.tsx          # Stack layout
│   │   ├── index.tsx
│   │   ├── faq.tsx
│   │   └── videos.tsx
│   │
│   ├── legal/                   # Legal documents
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── terms.tsx
│   │   ├── privacy.tsx
│   │   └── imprint.tsx
│   │
│   ├── yarnai/                  # AI feature screens
│   │   ├── chat.tsx             # AI chat assistant
│   │   ├── ideas.tsx            # Project idea generator
│   │   ├── image-generator.tsx  # Image generation
│   │   └── voice.tsx            # Voice assistant
│   │
│   ├── project/
│   │   └── [id].tsx             # Dynamic route - project detail
│   │
│   ├── edit-project/
│   │   └── [id].tsx             # Edit project modal
│   │
│   ├── edit-inventory/
│   │   └── [id].tsx             # Edit inventory modal
│   │
│   ├── add-project.tsx          # Add project modal
│   ├── add-inventory.tsx        # Add inventory modal
│   ├── video-player.tsx         # Video playback
│   └── +not-found.tsx           # 404 screen
│
├── components/                   # Reusable UI components
│   ├── Avatar.tsx
│   ├── Button.tsx               # Custom button component
│   ├── Card.tsx
│   ├── EmptyState.tsx
│   ├── ImageGallery.tsx
│   ├── Input.tsx                # Form input
│   ├── ModalHeader.tsx
│   └── UniversalHeader.tsx
│
├── hooks/                        # Custom React hooks + Context providers
│   ├── auth-context.tsx         # AuthProvider + useAuth
│   ├── projects-context.tsx     # ProjectsProvider + useProjects
│   ├── inventory-context.tsx    # InventoryProvider + useInventory
│   ├── language-context.tsx     # LanguageProvider + useLanguage
│   ├── useImagePicker.tsx       # Image picker hook
│   └── useInventoryHelpers.tsx  # Inventory utilities
│
├── types/                        # TypeScript definitions
│   └── index.ts                 # All app types (Project, InventoryItem, User)
│
├── constants/                    # App constants
│   ├── colors.ts                # Color palette
│   ├── typography.ts            # Text styles
│   └── avatars.ts               # Avatar configurations
│
├── translations/                 # i18n translation files
│   └── [language files]         # Localization strings
│
├── assets/                       # Static assets
│   └── images/                  # Icons, splash, images
│
├── docs/                         # Project documentation
│   ├── README.md
│   ├── PROJECT_OVERVIEW.md
│   ├── TECH_STACK.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODELS.md
│   └── LIBRARIES.md
│
├── app.json                      # Expo configuration
├── tsconfig.json                 # TypeScript config (strict mode)
├── eslint.config.js              # ESLint config
├── package.json                  # Dependencies & scripts
├── bun.lock                      # Bun lockfile
└── CLAUDE.md                     # This file
```

---

## 🎯 EXPO ROUTER 6 CRITICAL PATTERNS

**Expo Router 6 introduced BREAKING CHANGES from v5. Follow these patterns:**

### Root Layout Pattern (`app/_layout.tsx`)

```typescript
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/auth-context';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <ProjectsProvider>
            <InventoryProvider>
              <LanguageProvider>
                <Slot />  {/* Renders child routes */}
              </LanguageProvider>
            </InventoryProvider>
          </ProjectsProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
```

**✅ DO:** Use `<Slot />` in root layout
**❌ DON'T:** Use `<Stack>` in root layout with providers

### Nested Stack Layouts (`app/(auth)/_layout.tsx`)

```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: '#FAF7F0' },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
```

**✅ DO:** Include `<Stack.Screen>` children for static configuration
**❌ DON'T:** Use self-closing `<Stack />` in nested layouts

### Tab Navigation Pattern (`app/(tabs)/_layout.tsx`)

```typescript
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ /* ... */ }}>
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Volleyball color={color} size={26} />
          ),
        }}
      />
      {/* More tabs... */}
    </Tabs>
  );
}
```

**✅ DO:** Explicitly define `Tabs.Screen` for each tab
**❌ DON'T:** Try to auto-discover tabs

### Group Routes (Hidden from URL)

```
(auth)   → /login, /register  (NOT /auth/login)
(tabs)   → /projects, /inventory  (NOT /tabs/projects)
```

Use parentheses to group routes without affecting URLs.

---

## 🧩 COMPONENT PATTERNS

### Function Declarations (REQUIRED)

```typescript
// ✅ CORRECT - Function declaration
export function UserProfile({ userId }: Props) {
  return <View>{/* ... */}</View>;
}

// ❌ WRONG - Arrow function
export const UserProfile = ({ userId }: Props) => {
  return <View>{/* ... */}</View>;
};
```

### Props Interface Pattern

```typescript
interface UserProfileProps {
  userId: string;
  onUpdate: (user: User) => void;
  variant?: 'compact' | 'full';
}

export function UserProfile({ userId, onUpdate, variant = 'full' }: UserProfileProps) {
  // Component logic
}
```

### StyleSheet API (PRIMARY)

```typescript
import { StyleSheet, View, Text, Platform } from 'react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  title: {
    ...Typography.title2,
    color: Colors.charcoal,
  },
});

export function Card() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
}
```

**✅ DO:** Use StyleSheet.create for all styles
**❌ DON'T:** Use inline styles `style={{ padding: 10 }}`

---

## 🗃️ STATE MANAGEMENT PATTERNS

### Context API with Custom Hook

```typescript
// hooks/projects-context.tsx
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export const [ProjectsProvider, useProjects] = createContextHook(() => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await AsyncStorage.getItem('projects');
      if (data) setProjects(JSON.parse(data));
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProjects = async (updated: Project[]) => {
    await AsyncStorage.setItem('projects', JSON.stringify(updated));
  };

  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    await saveProjects(updated);
  };

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
  };
});

// Usage in component
import { useProjects } from '@/hooks/projects-context';

export function ProjectsList() {
  const { projects, isLoading, addProject } = useProjects();

  if (isLoading) return <LoadingSpinner />;

  return <FlatList data={projects} />;
}
```

### Zustand (for Complex Global State)

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        setTheme: (theme) => set({ theme }),
      }),
      {
        name: 'app-storage',
      }
    )
  )
);

// Usage
const theme = useAppStore((state) => state.theme);
const setTheme = useAppStore((state) => state.setTheme);
```

---

## 💾 DATA PERSISTENCE

### AsyncStorage Pattern

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data
await AsyncStorage.setItem('key', JSON.stringify(data));

// Load data
const data = await AsyncStorage.getItem('key');
const parsed = data ? JSON.parse(data) : null;

// Delete data
await AsyncStorage.removeItem('key');

// Clear all
await AsyncStorage.clear();
```

**IMPORTANT:** Always wrap in try/catch and handle JSON parsing errors.

---

## 🎨 STYLING SYSTEM

### Color Palette (`constants/colors.ts`)

```typescript
const Colors = {
  // Primary palette
  cream: '#FAF7F0',
  deepSage: '#4A5D4F',
  deepTeal: '#2C7873',

  // Neutrals
  charcoal: '#333333',
  warmGray: '#6B6B6B',
  beige: '#E8DCC4',

  // System
  white: '#FFFFFF',
  black: '#000000',
  border: '#E0E0E0',
};

export default Colors;
```

### Typography System (`constants/typography.ts`)

```typescript
export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
};
```

---

## 🗄️ SUPABASE INTEGRATION

### Supabase Client Setup

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Authentication with Supabase Auth

```typescript
// hooks/auth-context.tsx
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || session.user.email!.split('@')[0],
          avatar: session.user.user_metadata.avatar_url,
        });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || session.user.email!.split('@')[0],
          avatar: session.user.user_metadata.avatar_url,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) throw error;
    return data.user;
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data.user;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'crochettracker://reset-password',
    });

    if (error) throw error;
  };

  return { user, session, isAuthenticated: !!user, register, login, logout, resetPassword };
});
```

### Database Queries

```typescript
// Fetch projects
const { data: projects, error } = await supabase
  .from('projects')
  .select('*')
  .order('created_at', { ascending: false });

// Insert project
const { data, error } = await supabase
  .from('projects')
  .insert({
    user_id: user.id,
    title: 'My Project',
    description: 'Description here',
    status: 'in-progress',
  })
  .select()
  .single();

// Update project
const { error } = await supabase
  .from('projects')
  .update({ status: 'completed' })
  .eq('id', projectId);

// Delete project
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId);
```

### Storage: Upload Images

```typescript
import { supabase } from '@/lib/supabase/client';

export async function uploadProjectImage(
  userId: string,
  projectId: string,
  fileUri: string
): Promise<string> {
  // Read file as blob
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const fileName = `${userId}/${projectId}/${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from('project-images')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('project-images')
    .getPublicUrl(data.path);

  return publicUrl;
}
```

### Real-time Subscriptions

```typescript
// Listen for project changes
useEffect(() => {
  const channel = supabase
    .channel('projects')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        console.log('Project changed:', payload);
        // Update local state
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user.id]);
```

### TanStack Query Integration

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch projects with caching
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// Add project with optimistic updates
export function useAddProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

### Row Level Security (RLS) Best Practices

**ALWAYS enable RLS on all tables:**

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Test RLS policies:**

```typescript
// This should only return the authenticated user's projects
const { data } = await supabase.from('projects').select('*');
```

### Environment Variables

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**IMPORTANT:**
- Use `EXPO_PUBLIC_` prefix for client-side variables
- Never commit `.env` to git
- Use `.env.example` for documentation
- Get keys from Supabase Dashboard → Settings → API

### Supabase Resources

- **Database Schema**: See `/docs/SUPABASE_PLAN.md`
- **SQL Migrations**: See `/supabase/migrations/`
- **Data Migration**: See `/scripts/migrate-to-supabase.ts`
- **Official Docs**: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native

---

## 🌍 INTERNATIONALIZATION (i18n-js)

```typescript
// hooks/language-context.tsx
import { I18n } from 'i18n-js';
import en from '@/translations/en.json';
import sl from '@/translations/sl.json';

const i18n = new I18n({
  en,
  sl,
});

i18n.defaultLocale = 'en';
i18n.locale = 'en';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [locale, setLocale] = useState(i18n.locale);

  const changeLanguage = (newLocale: string) => {
    i18n.locale = newLocale;
    setLocale(newLocale);
  };

  const t = (key: string, params?: object) => i18n.t(key, params);

  return { locale, changeLanguage, t };
});

// Usage
const { t } = useLanguage();

<Text>{t('welcome.title')}</Text>
<Text>{t('projects.count', { count: 5 })}</Text>
```

---

## 🤖 AI INTEGRATION (Google Generative AI)

```typescript
import { GoogleGenerativeAI } from '@google/genai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GOOGLE_AI_KEY!);

export async function generateProjectIdea(prompt: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: prompt }],
    }],
  });

  return result.response.text();
}
```

---

## 📸 MEDIA HANDLING

### Image Picker

```typescript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    return result.assets[0].uri;
  }
};
```

### Camera

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission?.granted) {
    return <PermissionPrompt onGrant={requestPermission} />;
  }

  return (
    <CameraView style={{ flex: 1 }}>
      {/* Camera UI */}
    </CameraView>
  );
}
```

### Audio Recording (expo-audio)

```typescript
import { useAudioRecorder, usePermissions } from 'expo-audio';

export function VoiceRecorder() {
  const audioRecorder = useAudioRecorder();
  const [permissionResponse, requestPermission] = usePermissions();

  const startRecording = async () => {
    if (permissionResponse?.status !== 'granted') {
      await requestPermission();
    }
    await audioRecorder.record();
  };

  const stopRecording = async () => {
    const uri = await audioRecorder.stop();
    return uri;
  };

  return (
    <Button
      onPress={audioRecorder.isRecording ? stopRecording : startRecording}
      title={audioRecorder.isRecording ? 'Stop' : 'Record'}
    />
  );
}
```

---

## 🔧 TYPESCRIPT CONFIGURATION

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## ♿ WCAG 2.2 ACCESSIBILITY COMPLIANCE

**This app MUST comply with WCAG 2.2 Level AA standards.**

### Mandatory Requirements

**1. Color Contrast (WCAG 2.2 Success Criterion 1.4.3)**
- Normal text (< 18pt): **Minimum 4.5:1** ratio
- Large text (≥ 18pt): **Minimum 3:1** ratio
- UI components: **Minimum 3:1** ratio

```typescript
// Use accessible colors from constants
import { ACCESSIBLE_COLORS } from '@/constants/accessibility';

// ✅ PASS: Charcoal on Cream (9.8:1)
color: Colors.charcoal // on Colors.cream background

// ⚠️ WARNING: WarmGray on Cream (4.2:1) - large text only
color: Colors.warmGray // Use only for large text

// ✅ PASS: Accessible error color (4.5:1)
color: ACCESSIBLE_COLORS.errorAccessible
```

**2. Touch Target Size (WCAG 2.2 Success Criterion 2.5.8)**
- **Minimum 44x44 points** for all interactive elements

```typescript
import { MINIMUM_TOUCH_TARGET, getAccessibleHitSlop } from '@/constants/accessibility';

// Buttons already meet requirement (min 46pt height)
<Button title="Submit" /> // ✅ 46-60pt height

// For smaller elements, add hitSlop
<TouchableOpacity
  hitSlop={getAccessibleHitSlop(24)} // Adds padding to meet 44pt
>
  <Icon size={24} />
</TouchableOpacity>
```

**3. Accessibility Labels (WCAG 2.2 Success Criterion 4.1.2)**
- **Every interactive element MUST have an accessibility label**

```typescript
// Button with label
<Button
  title="Add Project"
  accessibilityLabel="Add new crochet project"
  accessibilityHint="Opens form to create a new project"
/>

// Icon button
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Delete project"
  accessibilityHint="Removes this project permanently"
>
  <Trash size={24} />
</TouchableOpacity>

// Image
<Image
  source={{ uri: project.image }}
  accessibilityLabel={`${project.title} project photo`}
  accessibilityRole="image"
/>

// Decorative elements
<Image
  source={require('./decoration.png')}
  accessible={false}
  accessibilityLabel=""
/>
```

**4. Form Inputs (WCAG 2.2 Success Criteria 3.3.1, 3.3.2, 3.3.3)**

```typescript
<Input
  label="Email"
  required={true}
  error={emailError}
  accessibilityLabel="Email address"
  accessibilityRequired={true}
  accessibilityInvalid={!!emailError}
/>

// Error announcements
{error && (
  <View
    accessible={true}
    accessibilityLiveRegion="polite"
    accessibilityRole="alert"
  >
    <Text>{error}</Text>
  </View>
)}
```

**5. Text Scaling (WCAG 2.2 Success Criterion 1.4.4)**

```typescript
import { MAX_FONT_SIZE_MULTIPLIER } from '@/constants/accessibility';

// Limit font scaling to prevent layout breaks
<Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>
  Content
</Text>
```

**6. Focus Indicators (WCAG 2.2 Success Criterion 2.4.7)**

```typescript
function AccessibleButton() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={[
        styles.button,
        isFocused && {
          borderWidth: 2,
          borderColor: Colors.deepTeal,
          shadowColor: Colors.deepTeal,
          shadowOpacity: 0.5,
        },
      ]}
    >
      <Text>Button</Text>
    </Pressable>
  );
}
```

**7. Semantic Roles (WCAG 2.2 Success Criterion 4.1.2)**

```typescript
import { AccessibilityRoles } from '@/constants/accessibility';

<TouchableOpacity accessibilityRole={AccessibilityRoles.BUTTON} />
<Text accessibilityRole={AccessibilityRoles.HEADER} />
<Switch accessibilityRole={AccessibilityRoles.SWITCH} />
```

### Testing Requirements

**Before Committing:**
- [ ] Run `bun run lint:a11y` (if configured)
- [ ] Test with iOS VoiceOver (Settings → Accessibility → VoiceOver)
- [ ] Test with Android TalkBack (Settings → Accessibility → TalkBack)
- [ ] Verify all colors meet contrast requirements
- [ ] Check touch targets are ≥ 44x44pt
- [ ] Test with 200% text size (Dynamic Type)

### Resources

- **Full Guidelines**: See `/docs/ACCESSIBILITY.md`
- **Color Contrast**: `/constants/accessibility.ts` - `COLOR_CONTRAST_AUDIT`
- **Testing Checklist**: `/docs/ACCESSIBILITY.md` - Testing section
- **WCAG 2.2 Quick Reference**: https://www.w3.org/WAI/WCAG22/quickref/

---

## 📦 PACKAGE MANAGEMENT (BUN)

```bash
# Install dependencies (ALWAYS use Bun for this project)
bun install

# Add package
bun add <package>
bun add -d <dev-package>

# Update packages
bun update
bun update <package>@latest

# Remove package
bun remove <package>

# Run scripts
bun run start
bun run lint

# Execute packages
bunx expo start
bunx expo doctor
```

**⚠️ NEVER use npm for this project** - React 19 peer dependencies require Bun's lenient resolution.

---

## 🧪 DEVELOPMENT COMMANDS

```bash
# Development
bun run start              # Start with Rork tunnel
bun run start-web          # Web-only development
bunx expo start            # Standard Expo dev server
bunx expo start --tunnel   # With tunnel (for testing on device)
bunx expo start --ios      # iOS simulator
bunx expo start --android  # Android emulator
bunx expo start --web      # Web browser

# Code Quality
bun run lint               # ESLint check
bunx tsc --noEmit          # TypeScript check
bunx expo doctor           # Expo health check

# Environment
bunx expo install --fix    # Fix package versions
bunx expo customize        # Customize config files
bunx expo prebuild         # Generate native projects (if needed)
```

---

## 🚀 PERFORMANCE BEST PRACTICES

### FlatList Optimization

```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  windowSize={10}
  maxToRenderPerBatch={10}
  initialNumToRender={10}
  removeClippedSubviews={true}
  updateCellsBatchingPeriod={50}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
export const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  return <View>{/* ... */}</View>;
});

// Memoize expensive calculations
const sortedData = useMemo(
  () => data.sort((a, b) => a.date - b.date),
  [data]
);

// Memoize callbacks
const handlePress = useCallback(() => {
  doSomething(id);
}, [id]);
```

### Image Optimization

```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
  priority="high"
/>
```

---

## ⚠️ COMMON PITFALLS TO AVOID

1. **DON'T** use npm (use Bun for React 19 compatibility)
2. **DON'T** use inline styles (use StyleSheet.create)
3. **DON'T** use array index as FlatList key
4. **DON'T** nest FlatLists or ScrollViews
5. **DON'T** skip cleanup in useEffect
6. **DON'T** ignore Android back button behavior
7. **DON'T** use console.log in production (use `__DEV__`)
8. **DON'T** mutate state directly
9. **DON'T** forget to handle loading/error states
10. **DON'T** skip iOS and Android testing

---

## 📋 DECISION MATRIX

| Need | Solution |
|------|----------|
| Navigation | Expo Router 6 |
| Authentication | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Global State | Zustand / Context API |
| Server State | TanStack Query |
| Local Cache | AsyncStorage |
| Real-time Sync | Supabase Realtime |
| Icons | lucide-react-native |
| Images | expo-image |
| Camera | expo-camera |
| Audio Recording | expo-audio |
| AI Features | @google/genai |
| Animations | Animated API / Reanimated |
| i18n | i18n-js |
| Lists | FlatList |
| Forms | Controlled components |
| Styling | StyleSheet API |
| Package Manager | Bun (ONLY) |

---

## 🎯 FILE NAMING CONVENTIONS

```
✅ user-profile.tsx         # Components (kebab-case)
✅ useAuth.ts              # Hooks (camelCase with 'use' prefix)
✅ auth-context.tsx        # Context providers
✅ colors.ts               # Constants
✅ index.ts                # Barrel exports
✅ [id].tsx                # Dynamic routes

❌ UserProfile.tsx         # No PascalCase files
❌ use-auth.ts            # Hooks should be camelCase
❌ Auth-Context.tsx       # No PascalCase
```

---

## 📥 IMPORT ORDER

```typescript
// 1. React/React Native core
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Expo packages
import { router } from 'expo-router';
import { Camera } from 'expo-camera';

// 3. External libraries
import { useQuery } from '@tanstack/react-query';

// 4. Internal absolute imports (@/)
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/auth-context';
import Colors from '@/constants/colors';

// 5. Relative imports
import { helper } from './utils';

// 6. Types (at the end)
import type { Project, User } from '@/types';
```

---

## 🔒 SECURITY CHECKLIST

- [ ] Use expo-secure-store for sensitive data
- [ ] Never commit API keys (use environment variables)
- [ ] Validate all user inputs
- [ ] Handle permissions properly
- [ ] Implement proper auth flows
- [ ] Don't store passwords in AsyncStorage
- [ ] Use HTTPS for all network requests

---

## 🎨 DESIGN GUIDELINES

- Follow iOS Human Interface Guidelines for iOS
- Follow Material Design for Android
- Use platform-specific patterns (Platform.select)
- Maintain 60fps for animations
- Support dark mode (when implemented)
- Ensure accessibility (screen readers, labels)
- Test on multiple device sizes

---

## 📝 COMMIT CONVENTIONS

```bash
feat: add voice recording feature
fix: resolve navigation crash on Android
docs: update README with Bun instructions
style: format code with Prettier
refactor: simplify auth context logic
perf: optimize FlatList rendering
test: add unit tests for hooks
chore: upgrade to Expo SDK 54
```

**NO mentions of AI assistants in commits.**

---

## 🔗 ADDITIONAL RESOURCES

### Official Documentation
- [Expo SDK 54 Docs](https://docs.expo.dev/versions/latest/)
- [Expo Router 6 Docs](https://docs.expo.dev/router/introduction/)
- [React Native 0.81](https://reactnative.dev/docs/getting-started)
- [React 19 Docs](https://react.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase + React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [TanStack Query](https://tanstack.com/query/latest)
- [Bun Documentation](https://bun.sh/docs)

### Project-Specific
- **Supabase Plan**: `/docs/SUPABASE_PLAN.md`
- **SQL Migrations**: `/supabase/migrations/`
- **Migration Script**: `/scripts/migrate-to-supabase.ts`
- **Environment Setup**: `/.env.example`

### Migration Guides
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Expo Router 6 Migration](https://docs.expo.dev/router/migrate/)
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)

### Performance & Best Practices
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [TanStack Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/important-defaults)

---

**This document is enforced. No exceptions. Quality over speed.**


