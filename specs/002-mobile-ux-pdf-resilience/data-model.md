# Phase 1 Data Model: Base-Level PDF Generation Resilience & Premium Mobile-First Experience

## Entities & Interfaces

### 1. Normalized PDF Export Context (`NormalizedPdfContext`)

Represents the sanitized view model passed to the PDF generation template, preventing any null pointer exceptions or parsing failures.

```typescript
export interface NormalizedExercise {
  id: string
  name: string
  muscleGroup: string | null
  sets: number
  repetitions: string
  restTime: string
  weight: string | null
  customDescription: string | null
  videoUrl: string | null
  gifUrl: string | null
  groupType: "NORMAL" | "SUPERSET" | "TRISET" | "CIRCUIT" | "DROPSET" | "REST_PAUSE" | "TEMPO"
  groupId: string | null
}

export interface NormalizedWorkoutDay {
  id: string
  label: string
  order: number
  exercises: NormalizedExercise[]
}

export interface NormalizedSportContext {
  primarySport?: string
  description?: string
  coachNotes?: string
  targetMuscleGroups?: string[]
}

export interface NormalizedTrainerBranding {
  name: string
  bio: string | null
  logoDataUri: string | null
  isDefaultBrand: boolean
}

export interface NormalizedClientProfile {
  id: string
  name: string
  age?: number | null
  weight?: number | null
  height?: number | null
  primarySport?: string | null
}

export interface NormalizedPdfContext {
  id: string
  title: string
  createdAt: Date | string
  description: string | null
  trainer: NormalizedTrainerBranding
  client: NormalizedClientProfile | null
  sportContext: NormalizedSportContext | null
  workoutDays: NormalizedWorkoutDay[]
  pdfFileName: string
}
```

---

### 2. Navigation Tab Item (`NavigationTabItem`)

Model for the mobile bottom navigation bar and off-canvas drawer items.

```typescript
export interface NavigationTabItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  isMessages?: boolean
  badgeCount?: number
  allowedRoles: Array<"TRAINER" | "CLIENT" | "SUPER_ADMIN">
}
```

---

### 3. Mobile Navigation State (`MobileNavigationState`)

Client-side viewport and navigation drawer interaction state.

```typescript
export interface MobileNavigationState {
  isDrawerOpen: boolean
  activeTab: string
  unreadMessageCount: number
  isLiveWorkoutRoute: boolean
  isPrintRoute: boolean
  shouldRenderBottomNav: boolean
}
```
