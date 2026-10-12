# Implementation Plan: Base-Level PDF Generation Resilience & Premium Mobile-First Experience

**Branch**: `002-mobile-ux-pdf-resilience` | **Date**: 2026-10-12 | **Spec**: [specs/002-mobile-ux-pdf-resilience/spec.md](file:///h:/Work/Website/Gym-Scale/specs/002-mobile-ux-pdf-resilience/spec.md)

**Input**: Feature specification from `/specs/002-mobile-ux-pdf-resilience/spec.md`

## Summary

Resolve underlying PDF generation and preview failures, eliminate Service Worker / Workbox console promise rejections, and elevate the entire application to an ultra-premium, mobile-first experience.
Key technical pillars:
1. **Resilient PDF Pipeline**: Server API endpoints (`/api/routines/[id]/pdf` and `/api/diets/[id]/pdf`) defensively catch Puppeteer errors and fallback via an HTTP 307 temporary redirect to the native printable page with `autoPrint=true`. Provide dual native links and stream buttons in UI so browser popup blockers cannot intercept exports.
2. **Defensive Data Normalization**: Normalize `sportContext`, `repetitions`, and `restTime` in PDF templates to prevent null dereferences or string parsing crashes.
3. **PWA / Workbox Tuning**: Restrict dynamic authenticated SSR pages and API routes to `NetworkOnly` in `next.config.mjs`.
4. **Floating Glassmorphic Bottom Navigation**: Implement a mobile-only thumb-zone navigation bar (`< 1024px`) with safe area insets and role-based tabs (Trainer vs Client), automatically hidden on Live Workout and PDF preview routes.
5. **Morphing Animated Hamburger & Luxury Drawer**: A 3-bar morphing SVG hamburger transitioning to 'X', opening an off-canvas drawer with staggered menu items, user badges, and smooth backdrop blur.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 14.2+ (App Router, React 18)

**Primary Dependencies**: Tailwind CSS, Lucide React, Puppeteer Core / @sparticuz/chromium-min, Prisma ORM, NextAuth.js, next-pwa

**Storage**: PostgreSQL via Prisma ORM; Local disk storage for uploads (`public/uploads/logos`)

**Testing**: Static type checking (`tsc --noEmit`), build verification (`npm run build`), manual responsive viewport and PDF generation verification

**Target Platform**: Node.js 20+ on Linux Ubuntu VPS (FastCreate VPS), modern desktop and mobile browsers (iOS Safari, Android Chrome)

**Project Type**: Full-stack Next.js web application with PWA capabilities

**Performance Goals**:
- PDF route response or fallback redirect: < 5 seconds
- Mobile navigation transitions & hamburger morph: 60 fps (CSS transform & opacity only)
- Zero layout shift and zero horizontal scroll overflow on mobile viewports (>= 360px)

**Constraints**:
- Low VPS memory footprint (avoid crashing Puppeteer processes)
- Browser popup blocker immunity (native `<a>` tags and HTTP 307 redirects)
- Mobile safe area insets (`env(safe-area-inset-bottom)`) support

**Scale/Scope**:
- 2 API routes updated with fallback redirects
- 1 PDF template normalization helper and auto-print triggers
- 2 Mobile navigation components (`MobileBottomNav`, `MobileNavDrawer`, and morphing button in `Navbar`)
- Layout clearance (`pb-24 lg:pb-0`) and responsive client cards refactor

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Library & Helper Modularity** -> PASS: Reusable PDF normalization helper and isolated mobile navigation components.
- **Principle II: Zero Pop-up Blocker Traps** -> PASS: API HTTP 307 redirect + native UI links guarantee direct user navigation without unsolicited popups.
- **Principle III: Non-destructive Enhancements** -> PASS: Desktop navigation, existing API responses, and database schemas remain intact and backwards-compatible.
- **Principle IV: Responsive & Accessible UI** -> PASS: Floating bottom nav adheres to thumb-zone ergonomics; drawer handles Escape keys and body scroll lock.

## Project Structure

### Documentation (this feature)

```text
specs/002-mobile-ux-pdf-resilience/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 research & architectural decisions
├── data-model.md        # Phase 1 data models & normalized types
├── quickstart.md        # Phase 1 validation checklist
└── contracts/           # Phase 1 interface contracts
    ├── pdf-api-contract.md
    └── navigation-contract.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   ├── routines/[id]/pdf/route.ts   # Update: 307 redirect on Puppeteer error
│   │   └── diets/[id]/pdf/route.ts      # Update: 307 redirect on Puppeteer error
│   ├── clients/[id]/
│   │   └── page.tsx                     # Update: dual PDF actions & responsive reflow
│   ├── routines/[id]/
│   │   └── pdf/page.tsx                 # Update: autoPrint client trigger
│   ├── diets/[id]/
│   │   └── pdf/page.tsx                 # Update: autoPrint client trigger
│   └── layout.tsx                       # Update: integrate MobileBottomNav & pb-24 clearance
├── components/
│   ├── mobile-bottom-nav.tsx            # New: floating glassmorphic bottom navigation
│   ├── mobile-nav-drawer.tsx            # New/Update: animated off-canvas drawer
│   └── navbar.tsx                       # Update: morphing 3-bar hamburger button
├── lib/
│   ├── pdf-generator.ts                 # Update: defensive normalization
│   └── pdf-normalize.ts                 # New: shared defensive normalization utilities
└── next.config.mjs                      # Update: Workbox runtime caching bypass for dynamic routes
```

**Structure Decision**: Standard Next.js App Router structure with dedicated modular client components in `src/components/` and defensive helpers in `src/lib/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *None* | Architecture uses standard Next.js App Router conventions | N/A |
