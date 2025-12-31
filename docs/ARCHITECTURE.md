# Architecture

**See CLAUDE.md for complete standards.**

---

## Project Structure

```
app/                    # Expo Router 6 - file-based routing
├── (auth)/            # Auth group: login, register, forgot-password
├── (tabs)/            # Main tabs: projects, inventory, yarnai, profile
├── project/[id]       # Project detail
├── edit-project/[id]  # Edit project
├── edit-inventory/[id]# Edit inventory
├── inventory/[id]     # Inventory detail
├── yarnai/            # AI features: chat, ideas, image-generator, voice
├── help/              # FAQ, videos
├── legal/             # Terms, privacy, imprint
└── _layout.tsx        # Root layout with providers

components/            # Reusable UI components
hooks/                 # Custom hooks (deprecated - now providers/)
providers/             # Context providers (Auth, Projects, Inventory, Language)
constants/             # Colors, typography, accessibility, pixelRatio
translations/          # i18n files (en, de, sl, ru)
types/                 # TypeScript definitions
```

---

## State Management

| Context | Location | Purpose |
|---------|----------|---------|
| Auth | providers/AuthProvider | User session, login/logout |
| Projects | providers/ProjectsProvider | CRUD + Supabase sync |
| Inventory | providers/InventoryProvider | CRUD + Supabase sync |
| Language | providers/LanguageProvider | i18n translations |

---

## Data Flow

```
User Action → Context Function → Supabase → State Update → Re-render
```

---

## Navigation

- **Route Groups**: `(auth)`, `(tabs)` - grouped without affecting URLs
- **Dynamic Routes**: `[id].tsx` for parameterized routes
- **Layouts**: `_layout.tsx` for nested navigation

---

## Types

Source of truth: `types/index.ts`

Key interfaces: `Project`, `InventoryItem`, `User`, `YarnDetails`, `HookDetails`
