# Tasks: Base-Level PDF Generation Resilience & Premium Mobile-First Experience

**Branch**: `002-mobile-ux-pdf-resilience` | **Date**: 2026-10-12 | **Spec**: [specs/002-mobile-ux-pdf-resilience/spec.md](file:///h:/Work/Website/Gym-Scale/specs/002-mobile-ux-pdf-resilience/spec.md) | **Plan**: [specs/002-mobile-ux-pdf-resilience/plan.md](file:///h:/Work/Website/Gym-Scale/specs/002-mobile-ux-pdf-resilience/plan.md)

## Phase 1: Setup & Data Normalization Utilities

**Purpose**: Shared utilities for defensive PDF payload validation and service worker caching rules.

- [x] T001 [P] Create defensive PDF normalization helper in `src/lib/pdf-normalize.ts` to safely parse `sportContext` (string or object) and format exercise fields (`restTime`, `repetitions`, `sets`) without throwing runtime errors.
- [x] T002 [P] Update `next.config.mjs` to configure Workbox / Next-PWA runtime caching rules to bypass dynamic SSR routes (`/clients/*`, `/routines/*`, `/diets/*`, `/api/*`) with `NetworkOnly` strategy.

---

## Phase 2: Foundational PDF Resilience (Blocking Prerequisites for US1)

**Purpose**: Server API resilience and auto-print client triggers.

- [x] T003 Update routine PDF generation endpoint in `src/app/api/routines/[id]/pdf/route.ts` with try/catch redirect fallback (HTTP 307 to `/routines/[id]/pdf?clientId=...&autoPrint=true`) if Puppeteer generation encounters an error.
- [x] T004 [P] Update diet PDF generation endpoint in `src/app/api/diets/[id]/pdf/route.ts` with try/catch redirect fallback (HTTP 307 to `/diets/[id]/pdf?clientId=...&autoPrint=true`) if Puppeteer generation encounters an error.
- [x] T005 [P] Create auto-print trigger client component in `src/components/auto-print-trigger.tsx` and integrate into `src/app/routines/[id]/pdf/page.tsx` and `src/app/diets/[id]/pdf/page.tsx`.

---

## Phase 3: User Story 1 - Fail-Safe PDF Access & Document Export (Priority: P1) 🎯 MVP

**Goal**: Trainers and clients can download or view PDFs with zero 500 dead-ends and immunity to popup blockers.

**Independent Test**: Navigate to `/clients/[id]`, verify dual action buttons ("دانلود مستقیم PDF" and "چاپ و پیش‌نمایش PDF"), click both, verify no blocked popups and successful document access.

- [x] T006 [US1] Update `src/lib/pdf-generator.ts` to use `normalizeRoutinePdfData` from `src/lib/pdf-normalize.ts`, ensuring safe logo resolution and auto-fitting table styles.
- [x] T007 [US1] Update routine and diet action buttons on client details page in `src/app/clients/[id]/page.tsx` to provide both direct native `<Link href={previewUrl} target="_blank">` ("چاپ و پیش‌نمایش PDF") and streamed download button ("دانلود مستقیم PDF").
- [x] T008 [US1] Update `src/app/routines/[id]/routine-actions.tsx` and `src/app/diets/[id]/diet-actions.tsx` to include native direct print preview links alongside the download button.

**Checkpoint**: User Story 1 functional - PDF export has fail-safe fallback and cannot be blocked by popup blockers.

---

## Phase 4: User Story 2 - Native-Feel Mobile Bottom Navigation Bar (Priority: P1)

**Goal**: Persistent floating glassmorphic bottom navigation bar for mobile viewports (< 1024px) with thumb-zone ergonomics.

**Independent Test**: Load application in mobile viewport (360px–430px), verify floating pill displays role-appropriate tabs, active route highlight, unread message badge, and automatically hides on `/client/workout/*` and `*/pdf*`.

- [x] T009 [US2] Create floating glassmorphic bottom navigation component in `src/components/mobile-bottom-nav.tsx` with role-based tabs (Trainer: شاگردان, برنامه‌ها, تغذیه, پیام‌ها, پروفایل; Client: تمرین من, پیشرفت, پیام‌ها, پروفایل), safe area insets, and unread message count indicator.
- [x] T010 [US2] Update `src/app/layout.tsx` to render `<MobileBottomNav />` and add mobile bottom padding clearance (`pb-24 lg:pb-0`) to prevent UI clipping.
- [x] T011 [US2] Add route detection in `src/components/mobile-bottom-nav.tsx` to automatically hide bottom navigation on `/client/workout/*`, printable `*/pdf*`, and `/login`.

**Checkpoint**: User Story 2 functional - Mobile navigation bar active and ergonomically positioned.

---

## Phase 5: User Story 3 - Amazingly Animated Luxury Hamburger Menu & Drawer (Priority: P3)

**Goal**: Smooth 3-bar morphing hamburger icon transitioning to 'X' and a glassmorphic off-canvas navigation drawer with staggered animations.

**Independent Test**: Tap hamburger icon on mobile header, verify smooth 3-bar to 'X' morphing animation, drawer slide-in with backdrop blur, staggered item reveal, and outside click / escape key dismissal.

- [x] T012 [US3] Create animated 3-bar morphing hamburger toggle button in `src/components/navbar.tsx` using CSS keyframes / transitions (top bar rotates 45°, middle bar fades/scales, bottom bar rotates -45°).
- [x] T013 [US3] Build upgraded off-canvas drawer in `src/components/mobile-nav-drawer.tsx` with glassmorphism backdrop (`backdrop-blur-md`), cubic-bezier slide-in, user info card with role badge, staggered menu item animations, and direct link to profile/logo upload.
- [x] T014 [US3] Implement touch interactions in `src/components/mobile-nav-drawer.tsx` including swipe right to dismiss, outside click detection, and body scroll lock while drawer is active.

**Checkpoint**: User Story 3 functional - Bespoke animated hamburger menu and drawer fully operational.

---

## Phase 6: User Story 4 - End-to-End Responsive Viewport Adaptation (Priority: P2)

**Goal**: Ensure client detail page cards, metric pills, and routine tables reflow smoothly down to 360px without horizontal scroll bleed.

**Independent Test**: Inspect `/clients/[id]` on 360px viewport; confirm zero horizontal overflow (`overflow-x: hidden`), balanced metric pill grid, and wrapped header actions.

- [x] T015 [US4] Refactor metric pills grid and client profile header in `src/app/clients/[id]/page.tsx` to responsive flex/grid layouts with touch-friendly spacing (`min-h-[44px]`).
- [x] T016 [US4] Ensure responsive table reflow in workout and nutrition cards in `src/app/clients/[id]/page.tsx` to avoid content cutoff on small screens.

---

## Phase 7: Polish & Verification

**Purpose**: Cross-cutting verification, build validation, and deployment instructions.

- [x] T017 Run TypeScript type-checking (`npx tsc --noEmit`) and fix any type mismatches.
- [x] T018 Run Next.js production build (`npm run build`) to ensure all SSR and dynamic routes compile cleanly.
- [x] T019 Commit all changes with clear descriptive git commits and push to `origin main`.
- [x] T020 Provide clear copy-paste VPS update instructions for the user (`git pull`, `chmod +x`, `./scripts/deploy.sh`).
