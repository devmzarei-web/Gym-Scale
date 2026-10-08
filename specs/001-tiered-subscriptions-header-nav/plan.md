# Implementation Plan: Tiered Gym/Trainer Subscriptions & Responsive Single-Line Navigation

**Branch**: `001-tiered-subscriptions-header-nav` | **Date**: 2026-10-06 | **Spec**: [spec.md](file:///h:/Work/Website/Gym-Scale/specs/001-tiered-subscriptions-header-nav/spec.md)

**Input**: Feature specification from `/specs/001-tiered-subscriptions-header-nav/spec.md`

---

## Summary

Implement tiered subscriptions for gym owners and trainers (`TRIAL`, `STARTER`, `PRO`) with enforced client count caps, AI routine generation quotas, and an automated expiration lifecycle (3-day grace period with warning banner followed by full lockout). Concurrently, resolve all header navigation defects by enforcing strict single-line text formatting (`whitespace-nowrap`), providing a responsive slide-out drawer on viewports `< 1024px`, and truncating long user/gym titles in the green header profile dropdown.

---

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+  
**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Lucide React, NextAuth v5, Prisma 7 with `@prisma/adapter-pg`  
**Storage**: PostgreSQL (`nutritrain_db`) with Prisma ORM  
**Testing**: Local Next.js build verification (`npm run build`), end-to-end user scenario testing via browser  
**Target Platform**: Web (Responsive: Mobile 375px+, Tablet 768px+, Desktop 1024px-1440px+), deployed on Ubuntu 24.04 LTS VPS with PM2 & Nginx  
**Project Type**: Full-stack Next.js web application with Server Actions & API routes  
**Performance Goals**: < 100ms response time for client limit and quota validation checks; 0ms layout shift / height jitter on header resizing  
**Constraints**: Zero breaking changes to existing auth flow; maintain Persian RTL typography conventions; strict adherence to single-line navigation labels  
**Scale/Scope**: Up to 100+ active trainers and 10,000+ athletes  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Simplicity / YAGNI**: Reusing existing `Trainer` model attributes with enum `TrainerTier` and helper functions avoiding unnecessary microservices or extra tables. (PASS)
- **Non-breaking Architecture**: Retains `FREE` alongside new tiers `TRIAL`, `STARTER`, `PRO` to protect production records. (PASS)
- **Responsive & Design Standards**: Single-line text styling with robust Persian RTL truncation and drawer navigation. (PASS)

---

## Project Structure

### Documentation (this feature)

```text
specs/001-tiered-subscriptions-header-nav/
├── spec.md                  # Specification & user stories
├── plan.md                  # Implementation plan
├── research.md              # Phase 0 technical research & decisions
├── data-model.md            # Phase 1 data models & state machine
├── quickstart.md            # Phase 1 verification and test guide
├── contracts/               # Phase 1 API contracts
│   ├── subscription-enforcement.md
│   └── admin-trainer-api.md
└── checklists/
    └── requirements.md      # Specification quality checklist
```

### Source Code Impact

```text
src/
├── app/
│   ├── actions/
│   │   ├── admin.ts                    # Updated with tier presets & quota assignment
│   │   └── client.ts                   # Added client limit & expiration gating
│   ├── admin/
│   │   ├── add-trainer-modal.tsx       # Updated with tier presets & quotas
│   │   ├── trainer-table-actions.tsx   # Updated with tier selection & override controls
│   │   └── page.tsx                    # Updated trainer table badges & stats
│   ├── api/ai/
│   │   ├── generate-routine/route.ts   # Quota check & grace period verification
│   │   └── generate-diet/route.ts      # Quota check & grace period verification
│   ├── subscription-expired/
│   │   └── page.tsx                    # Account lockout screen with renewal CTA
│   └── layout.tsx                      # Injects grace-period warning banner
├── components/
│   ├── navbar.tsx                      # Single-line desktop nav + responsive mobile drawer
│   ├── navbar-user-dropdown.tsx        # Single-line truncated profile trigger
│   └── subscription-warning-banner.tsx # Persistent 3-day grace period alert
├── lib/
│   └── subscription.ts                 # Pure helper for tier calculations & expiration states
prisma/
└── schema.prisma                       # Updated TrainerTier enum & Trainer fields
```

**Structure Decision**: Integrated within existing Next.js App Router full-stack structure. Logic centralized in `@/lib/subscription.ts` for clean reusability between server actions, API routes, and client UI components.

---

## Complexity Tracking

No constitution violations detected. Standard Next.js server actions and Prisma models used.
