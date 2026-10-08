# Tasks: Tiered Gym/Trainer Subscriptions & Responsive Single-Line Navigation

**Feature**: `001-tiered-subscriptions-header-nav`  
**Input**: Design artifacts from `specs/001-tiered-subscriptions-header-nav/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`)  
**Status**: Completed  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema enhancement and shared subscription configuration

- [X] T001 Update `TrainerTier` enum to support `FREE`, `TRIAL`, `STARTER`, `PRO` and ensure default tier is `TRIAL` with `maxClients = 5`, `aiQuota = 3` in `prisma/schema.prisma`
- [X] T002 Execute Prisma database synchronization using `npm run db:push` in root directory
- [X] T003 [P] Create subscription helper library with tier presets, quota defaults, and 3-day grace period calculations in `src/lib/subscription.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core lifecycle evaluation, state machine, and subscription warning UI

**⚠️ CRITICAL**: Must complete before user story gating and navigation refinements

- [X] T004 Implement `getTrainerSubscriptionState` evaluating `ACTIVE` (now <= expiresAt), `GRACE_PERIOD` (now <= expiresAt + 3 days), and `LOCKED` (now > expiresAt + 3 days) in `src/lib/subscription.ts`
- [X] T005 [P] Create persistent warning banner component `SubscriptionWarningBanner` for 3-day grace period with link to `nutritrain.ir` in `src/components/subscription-warning-banner.tsx`
- [X] T006 [P] Create locked account page with renewal call-to-action in `src/app/subscription-expired/page.tsx`
- [X] T007 Integrate `SubscriptionWarningBanner` into root layout in `src/app/layout.tsx`

**Checkpoint**: Foundation ready - subscription state machine, grace period UI, and lockout views ready.

---

## Phase 3: User Story 1 - Tiered Gym/Trainer Subscription Limits & Gating (Priority: P1) 🎯 MVP

**Goal**: Enforce client capacity limits, monthly AI routine/diet quotas, 3-day grace period warning, and SuperAdmin tier management controls.

**Independent Test**: Configure trainer as `TRIAL` (5 clients, 3 AI); verify adding 6th client or 4th AI routine is blocked with clear Persian error. Verify expired account displays grace banner within 3 days and is locked after 3 days.

### Implementation for User Story 1

- [X] T008 [US1] Enforce client limit check (`activeClientCount < trainer.maxClients`) and lockout check (`state !== 'LOCKED'`) in `src/app/actions/client.ts`
- [X] T009 [P] [US1] Update AI routine generator quota decrement and lockout gate in `src/app/api/ai/generate-routine/route.ts`
- [X] T010 [P] [US1] Update AI diet generator quota decrement and lockout gate in `src/app/api/ai/generate-diet/route.ts`
- [X] T011 [US1] Update SuperAdmin server actions `createTrainer` and `updateTrainer` to handle `tier` presets (`TRIAL`, `STARTER`, `PRO`), `maxClients`, `aiQuota`, and `expiresAt` in `src/app/actions/admin.ts`
- [X] T012 [P] [US1] Update SuperAdmin add-trainer modal with tier selection and quota auto-population in `src/app/admin/add-trainer-modal.tsx`
- [X] T013 [P] [US1] Update SuperAdmin trainer edit drawer and actions with tier selection, manual overrides, and expiry date in `src/app/admin/trainer-table-actions.tsx`
- [X] T014 [US1] Update SuperAdmin trainer table view with tier badges (`آزمایشی`, `مربی پایه`, `باشگاه حرفه‌ای`) and client quota counters (`{current} از {max}`) in `src/app/admin/page.tsx`

**Checkpoint**: User Story 1 (P1 MVP) is fully functional and testable independently.

---

## Phase 4: User Story 2 - Single-Line Responsive Header Navigation (Priority: P2)

**Goal**: Eliminate two-line navigation text wrapping on desktop screens and provide an accessible slide-out drawer on tablets and mobile screens (< 1024px).

**Independent Test**: Resize browser across 375px, 768px, 1024px, 1280px, and 1440px. Confirm desktop items strictly fit on one single row without wrapping, and screens below 1024px display clean hamburger toggle opening the navigation drawer.

### Implementation for User Story 2

- [X] T015 [US2] Update desktop navigation container in `src/components/navbar.tsx` with `hidden lg:flex`, compact padding (`px-2.5 py-1.5`), and strict `whitespace-nowrap` on all 8 menu items
- [X] T016 [US2] Create responsive mobile navigation slide-out drawer component `MobileNavDrawer` with link list, icons, active highlights, and unread badges in `src/components/mobile-nav-drawer.tsx`
- [X] T017 [US2] Integrate hamburger menu button toggle (`lg:hidden`) and `MobileNavDrawer` into `src/components/navbar.tsx`

**Checkpoint**: User Stories 1 and 2 are fully operational and testable.

---

## Phase 5: User Story 3 - Single-Line Responsive Profile Dropdown (Priority: P3)

**Goal**: Constrain the green profile dropdown button strictly to a single line with clean ellipsis truncation for long Persian gym and coach titles.

**Independent Test**: Log in with an account having a long name (e.g. "استاد علیرضا محمودیان باشگاه پارس") and verify the green dropdown button maintains fixed single-line height, renders text with ellipsis (`...`), and dropdown stays aligned without causing horizontal scroll.

### Implementation for User Story 3

- [X] T018 [US3] Add `whitespace-nowrap shrink-0` and clamp user name with `truncate max-w-[120px] sm:max-w-[170px]` on the green profile trigger button in `src/components/navbar-user-dropdown.tsx`
- [X] T019 [US3] Add tier badge display (`آزمایشی` / `پایه` / `پرو`) inside user dropdown menu details header in `src/components/navbar-user-dropdown.tsx`

**Checkpoint**: All three user stories are completely implemented and functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end verification, type checking, and build validation

- [X] T020 Run local production build `npm run build` to verify TypeScript compile integrity and zero build regressions
- [X] T021 Validate end-to-end verification scenarios per `specs/001-tiered-subscriptions-header-nav/quickstart.md`
- [X] T022 Document subscription management summary in `SETUP_GUIDE.md`
- [X] T023 Replace native `<select>` with custom `TierSelectDropdown` and replace English "AI" with "هوش مصنوعی" across admin UI for RTL text stability

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: Complete.
- **Phase 2 (Foundational)**: Complete.
- **Phase 3 (User Story 1 - P1 MVP)**: Complete.
- **Phase 4 (User Story 2 - P2)**: Complete.
- **Phase 5 (User Story 3 - P3)**: Complete.
- **Phase 6 (Polish)**: Complete.
