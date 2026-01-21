# My Journey Screen - Design Document

**Date**: 2025-01-21
**Status**: Approved
**Author**: AI-assisted design session

---

## Overview

A personal storytelling screen that helps solo crochet makers reflect on their craft journey. Unlike traditional analytics dashboards, this screen uses warm narrative language that adapts to any data size - from first-time users to seasoned crafters.

### Design Principles

1. **Story over Statistics** - Tell their journey, don't chart it
2. **Every Number Feels Good** - "4 skeins waiting" not "only 4 skeins"
3. **No Empty States** - Adaptive language for any data size
4. **Warm & Personal** - Like a letter to yourself, not a dashboard

---

## Entry Point

### Location
Profile screen - replace current "Your Progress" card with an enticing preview:

```
┌─────────────────────────────────────────┐
│  ✨ Your Craft Journey                  │
│                                         │
│  12 hours of creativity                 │
│  2 beautiful creations                  │
│                                         │
│  [View My Journey →]                    │
└─────────────────────────────────────────┘
```

### Navigation
- **Route**: `/journey`
- **File**: `app/journey.tsx`
- **Back**: Returns to Profile

---

## Screen Structure

### Header
Standard dark green header (`Colors.headerBg`) with:
- Back button (← Back)
- Title: "My Journey"
- No help button (this is a reflective space)

### Content Sections

#### 1. Opening Story
The journey's beginning - when and what started it all.

```
Your craft story began in May 2024
with "Tiny Bunny" 🐰
```

**Data Sources**:
- `projects[0].createdAt` (sorted by date) → journey start
- First project with `completedDate` → first creation name

**Adaptive Language**:
| State | Copy |
|-------|------|
| 0 projects | "Your craft story is about to begin..." |
| 1+ projects, 0 completed | "Your craft story began [date] with [first project name] - still in progress!" |
| 1+ completed | "Your craft story began [date] with [first completed name]" |

---

#### 2. Time Investment
Hours spent crafting with a fun, relatable conversion.

```
Since then, you've spent
12 hours with yarn in hand
(that's 6 movies worth of cozy time!)
```

**Data Sources**:
- Sum of `durationMinutes` from all `ProjectTimeSession` records
- Convert to hours for display

**Fun Conversions**:
| Hours | Comparison |
|-------|------------|
| 1-5 | "a good podcast" |
| 6-20 | "X movies worth of cozy time" (hours ÷ 2) |
| 21-50 | "an entire TV season" |
| 51-100 | "a cross-country road trip" |
| 100+ | "a master crafter's dedication" |

**Adaptive Language**:
| State | Copy |
|-------|------|
| 0 hours tracked | Skip this section entirely |
| < 1 hour | "You've started your first hour of crafting" |
| 500+ hours | "You've devoted 500 hours to your craft - a true artisan" |

---

#### 3. Your Collection
Stash summary with hopeful, anticipatory framing.

```
Your collection
🧶 4 skeins waiting to become something beautiful
🪝 2 trusted hooks by your side
```

**Data Sources**:
- `items.filter(i => i.category === 'yarn')` → yarn count (sum quantities)
- `items.filter(i => i.category === 'hook')` → hook count

**Adaptive Language**:
| State | Copy |
|-------|------|
| 0 yarn | "🧶 Your first yarn is waiting to be found" |
| 1 yarn | "🧶 1 skein ready for its story" |
| 2-10 yarn | "🧶 X skeins waiting to become something beautiful" |
| 10+ yarn | "🧶 X skeins - a true stash to be proud of!" |
| 0 hooks | "🪝 Every maker needs their first hook" |
| 1 hook | "🪝 1 trusted hook by your side" |
| 2+ hooks | "🪝 X trusted hooks in your collection" |

---

#### 4. Your Creations
Project counts with celebratory framing.

```
Your creations
✨ 2 finished with love
🔥 1 in progress right now
```

**Data Sources**:
- `completedCount` from ProjectsProvider
- `inProgressCount` from ProjectsProvider

**Adaptive Language**:
| State | Copy |
|-------|------|
| 0 completed | "✨ Your first finished piece awaits" |
| 1 completed | "✨ 1 creation finished with love" |
| 2-10 completed | "✨ X finished with love" |
| 10+ completed | "✨ X beautiful creations brought to life" |
| 0 in progress | Skip or "Ready to start something new?" |
| 1 in progress | "🔥 1 in progress right now" |
| 2+ in progress | "🔥 X projects in progress" |

---

#### 5. Fun Fact
A surprising, delightful discovery using yarn metrics.

```
Fun fact: Your yarn could stretch
340 meters - taller than the Eiffel Tower! 🗼
```

**Data Sources**:
- Sum of `yarnDetails.meters × quantity` for all yarn inventory

**Comparisons** (pick contextually):
| Meters | Comparison |
|--------|------------|
| 10-100 | "across a football field" |
| 100-300 | "taller than the Statue of Liberty (93m)" |
| 300-500 | "taller than the Eiffel Tower (330m)" |
| 500-1000 | "X laps around a running track" |
| 1000+ | "X kilometers - you could yarn-bomb a whole street!" |

**Adaptive Language**:
| State | Copy |
|-------|------|
| 0 meters data | Show alternative fact (hook sizes, project types, etc.) |
| < 10 meters | "Your yarn journey is just beginning!" |

**Alternative Fun Facts** (when yarn meters unavailable):
- "You've tried X different yarn weights"
- "Your hooks range from Xmm to Xmm"
- "You've been crafting for X months"

---

#### 6. Footer
Soft, warm closing.

```
Made with 💚 for makers
```

---

## Visual Design

### Colors
- **Background**: `Colors.beige`
- **Cards**: `Colors.white` with subtle `Colors.border`
- **Section headers**: `Colors.charcoal`
- **Body text**: `Colors.warmGray`
- **Accent icons**: `Colors.sage`, `Colors.teal`
- **Emojis**: Used sparingly for warmth (🧶 🪝 ✨ 🔥 🐰)

### Typography
- **Opening story**: `Typography.title2` for dates, `Typography.body` for description
- **Numbers**: `Typography.title1` when featured
- **Body text**: `Typography.body`
- **Fun fact**: `Typography.body` with `Colors.deepSage` highlight

### Spacing
- Section padding: 24px horizontal, 16px vertical
- Between sections: 24px gap
- Card border radius: 16px

---

## Empty State (New Users)

When user has 0 projects and 0 inventory:

```
┌─────────────────────────────────────────┐
│                                         │
│              🧶                         │
│                                         │
│    Your craft journey                   │
│    is about to begin                    │
│                                         │
│    Add your first project or            │
│    start building your yarn stash       │
│    to see your story unfold.            │
│                                         │
│    [Add First Project]                  │
│                                         │
└─────────────────────────────────────────┘
```

---

## Data Dependencies

### From ProjectsProvider
- `projects` array
- `completedCount`
- `inProgressCount`

### From InventoryProvider
- `items` array
- Filter by `category` (yarn, hook)
- `yarnDetails.meters` for fun facts

### From TimeSessionsProvider
- All sessions for total hours calculation

### Computed (in component or hook)
- Journey start date (first project createdAt)
- First completed project name
- Total yarn meters
- Fun comparison selection

---

## Internationalization

All strings must be in translation files (en, sl, de, ru).

### Key Structure
```
journey.title: "My Journey"
journey.storyBegan: "Your craft story began in {date}"
journey.withFirstProject: "with \"{projectName}\""
journey.hoursSpent: "{hours} hours with yarn in hand"
journey.funTimeComparison: "that's {count} movies worth of cozy time!"
journey.yarnWaiting: "{count} skeins waiting to become something beautiful"
journey.hooksCollection: "{count} trusted hooks by your side"
journey.finishedWithLove: "{count} finished with love"
journey.inProgress: "{count} in progress right now"
journey.funFact: "Fun fact: Your yarn could stretch"
journey.emptyState.title: "Your craft journey is about to begin"
journey.emptyState.subtitle: "Add your first project or start building your yarn stash"
journey.footer: "Made with 💚 for makers"
```

---

## Accessibility (WCAG 2.2 AA)

- All text meets 4.5:1 contrast ratio
- Emojis have `accessibilityLabel` alternatives
- Screen reader announces sections logically
- Touch targets minimum 44x44pt for buttons
- No auto-playing animations

---

## Implementation Notes

### File Structure
```
app/journey.tsx          # Main screen
hooks/useJourneyStats.ts # Data aggregation hook (optional)
```

### Key Hook (suggested)
```typescript
function useJourneyStats() {
  const { projects, completedCount, inProgressCount } = useProjects();
  const { items } = useInventory();
  const { sessions } = useTimeSessions();

  return useMemo(() => ({
    journeyStartDate: getFirstProjectDate(projects),
    firstCompletedName: getFirstCompletedProject(projects)?.title,
    totalHours: calculateTotalHours(sessions),
    yarnCount: countYarnSkeins(items),
    hookCount: countHooks(items),
    totalYarnMeters: calculateTotalMeters(items),
    completedCount,
    inProgressCount,
  }), [projects, items, sessions, completedCount, inProgressCount]);
}
```

### Profile Screen Changes
1. Remove "Your Progress" card (lines ~715-728)
2. Add "Your Craft Journey" preview card with navigation button
3. Import `router` for navigation to `/journey`

---

## Future Enhancements (Out of Scope)

These could be added later but are NOT part of initial implementation:

- Share journey as image (social media)
- Yearly recap feature ("Your 2024 in Stitches")
- Comparison to previous months
- Goal setting ("I want to complete 5 projects this year")

---

## Approval

- [x] Entry point from Profile
- [x] Narrative storytelling approach
- [x] Adaptive language for all data sizes
- [x] Warm, celebratory tone
- [x] Fun fact comparisons
- [x] Empty state for new users

**Ready for implementation.**
