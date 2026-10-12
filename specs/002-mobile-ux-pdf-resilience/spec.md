# Feature Specification: Base-Level PDF Generation Resilience & Premium Mobile-First Experience

**Feature Branch**: `002-mobile-ux-pdf-resilience`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "the problem i think is more underlying , when i open the client page , the error appears in console anyways, the 500 error appears when i try to download the pdf, right now even the preview wont open automatically, so something in our database is causing problems and not working properly, fix these issues at the base level also make the entire application properly responsive and MOBILE FRIENDLY, with good bottom navigation for major tabs, a really unique and amazingly aniamted Hamburger menu for full navigation"

## Clarifications

### Session 2026-10-12

- Q: How should the mobile bottom navigation bar behave during focused full-screen experiences like the Live Workout session and PDF print pages? (FR-004) → A: Option A: Automatically hide the bottom navigation bar on Live Workout pages (`/client/workout/*`) and printable PDF pages (`*/pdf`), keeping it persistently docked on all main dashboard, routine, diet, message, and profile views.
- Q: When a user initiates "دانلود مستقیم PDF", if the server-side PDF rendering engine encounters a delay or server limitation, what should be the immediate fallback behavior? (FR-002) → A: Option A: Seamless Server Redirect: The API route itself returns an HTTP 307 redirect to the printable preview page with `?autoPrint=true`, completely bypassing popup blockers and immediately invoking browser print/save.
- Q: How should the mobile bottom navigation bar be visually styled and positioned on mobile screens? (FR-004) → A: Option A: Floating Glassmorphic Pill: A floating bar with rounded corners (`rounded-3xl`), subtle margins, glassmorphism blur, and refined shadow (`bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xl`) floating neatly above the phone home bar.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fail-Safe PDF Access & Database-Resilient Document Export (Priority: P1)

As a trainer or client viewing a workout or nutrition program, I want to download or view the PDF document without encountering server 500 errors, broken promises, or blocked popups, so that my coaching documents are always immediately accessible and printable.

**Why this priority**:
Reliable program delivery is the core value proposition of NutriTrain. Any 500 server crash or blocked popup prevents trainers from sharing plans and clients from executing workouts.

**Independent Test**:
Can be tested independently by navigating to any client page (`/clients/[id]`), routine detail page, or diet page, clicking both "چاپ و پیش‌نمایش PDF" and "دانلود مستقیم PDF", and verifying that:
1. The server API route sanitizes all database entities (null values, corrupt JSON, stringified contexts, missing relations) without throwing 500 exceptions.
2. In the event of any server rendering issue, the request automatically falls back to the client-printable preview route with auto-print, preventing dead ends.
3. Direct links and buttons never trigger browser popup blockers.

**Acceptance Scenarios**:
1. **Given** a routine assigned to a client with arbitrary data (e.g. missing sport context, null notes, empty rest intervals), **When** the user clicks "دانلود مستقیم PDF", **Then** the server generates the PDF successfully with status 200, or gracefully redirects to the print preview page (`/routines/[id]/pdf?clientId=[id]&autoPrint=true`).
2. **Given** a user clicks "چاپ و پیش‌نمایش PDF", **When** clicked, **Then** a new tab opens directly without being blocked by Chrome/Safari popup blockers, rendering the pixel-perfect layout and triggering the browser's print dialog.
3. **Given** dynamic routes like `/clients/[id]`, **When** the page loads, **Then** the service worker does not throw `Uncaught (in promise) no-response` or intercept API fetch events erroneously.

---

### User Story 2 - Native-Feel Mobile Bottom Navigation Bar (Priority: P1)

As a mobile user (trainer or client on smartphone/tablet), I want a persistent, high-convenience bottom navigation bar for primary tabs, so that I can switch between major sections with one thumb without reaching for the top of the screen.

**Why this priority**:
Modern sports and coaching apps (Nike Training Club, Strava, Hevy) rely on bottom navigation for primary workflows. Moving primary tabs to the thumb zone drastically improves mobile ergonomics and perceived performance.

**Independent Test**:
Can be tested independently by viewing the application on viewports `< 1024px` (specifically mobile widths 360px–430px), verifying:
1. Bottom bar remains docked cleanly above device safe area (`env(safe-area-inset-bottom)`).
2. For Trainers: Displays 5 primary tabs (شاگردان, برنامه‌ها, تغذیه, پیام‌ها with live unread badge, پروفایل).
3. For Clients: Displays primary tabs (تمرین من, پیشرفت, پیام‌ها, پروفایل).
4. Active tab has a distinct glowing pill / emerald accent with subtle micro-scale feedback.

**Acceptance Scenarios**:
1. **Given** a trainer browsing on a mobile device, **When** navigating between pages, **Then** the bottom navigation stays visible and highlights the active route accurately.
2. **Given** an unread message arrives, **When** the bottom bar renders, **Then** the "پیام‌ها" tab displays a live notification badge with pulsing animation.
3. **Given** a user scrolls down on long client/routine pages, **When** reaching the bottom of the page, **Then** page content is padded (`pb-24`) so no content or action button is obscured by the bottom bar.

---

### User Story 3 - Amazingly Animated Luxury Hamburger Menu & Drawer (Priority: P2)

As a user on a mobile device, I want a uniquely animated hamburger menu button that morphs into a close icon and smoothly reveals an off-canvas navigation drawer with fluid physics and staggered link reveals, so that secondary navigation feels delightful and premium.

**Why this priority**:
Elevates the visual branding of NutriTrain from a utilitarian web portal to a high-end, bespoke fitness platform, addressing the user's explicit request for a "really unique and amazingly animated Hamburger menu".

**Independent Test**:
Can be tested independently on mobile by tapping the hamburger icon:
1. The 3 hamburger lines morph smoothly into an 'X' using synchronized CSS/SVG transforms.
2. The drawer slides in with cubic-bezier / spring physics alongside a backdrop blur.
3. Menu items appear sequentially with staggered fade-in/slide-in effects.
4. Background page scrolling is locked while the drawer is open and restored immediately on close.

**Acceptance Scenarios**:
1. **Given** the mobile view, **When** the user taps the animated hamburger icon, **Then** the icon morphs into a close 'X', the backdrop blurs, and the drawer slides in from the right with staggered items.
2. **Given** the drawer is open, **When** the user taps outside, presses Escape, or swipes right, **Then** the drawer closes smoothly and body scroll unlocks.
3. **Given** the drawer is open, **When** viewing the drawer content, **Then** the user card, role badge, quick links (بانک حرکات, دستورپخت‌ها, مدیریت سیستم), and profile/logo upload button are accessible with touch targets >= 44px.

---

### User Story 4 - End-to-End Responsive Viewport Adaptation (Priority: P2)

As a user accessing client details, routine tables, and nutrition plans on various mobile screens, I want all cards, metrics, and tables to adapt without horizontal clipping or awkward wrapping.

**Why this priority**:
Ensures readability of calorie targets, TDEE metrics, and exercise routines on screens as narrow as 360px (Pixel, iPhone SE, Galaxy).

**Independent Test**:
Can be tested independently by loading `/clients/[id]` on a 360px–412px screen and verifying:
1. Header action buttons wrap cleanly without overlapping.
2. Metric pills (BMR, TDEE, Body Fat) scale into balanced grid columns.
3. Routine and diet cards provide clear stacked action buttons.

**Acceptance Scenarios**:
1. **Given** a 375px mobile viewport on `/clients/[id]`, **When** the page renders, **Then** there is zero unwanted horizontal page scroll (`overflow-x: hidden`).
2. **Given** routine actions on mobile, **When** presented, **Then** action buttons ("مشاهده جزئیات", "دانلود PDF", "چاپ") are full-width or flex-wrap with clear spacing.

---

### Edge Cases

- **Corrupted or Stringified `sportContext` in Routine**: System safely parses `routine.sportContext` whether it is a parsed JSON object, a raw JSON string, or null/undefined, preventing runtime TypeErrors.
- **Missing or Disconnected Trainer**: System falls back to default brand name ("مربی تخصصی NutriTrain") and standard brand logo without throwing null property errors.
- **Strict Popup Blocker in Browser**: Primary UI actions provide native `<a>` or `<Link target="_blank">` tags so browser security mechanisms treat user clicks as intentional navigation rather than blocked popups.
- **Service Worker Stale-Route Interception**: Service worker configuration excludes dynamic authenticated SSR routes (`/clients/*`, `/routines/*`, `/diets/*`, `/api/*`) from aggressive caching to avoid rejected promise `no-response` errors.
- **Safe Area Insets on iPhone Notch / Dynamic Island / Android Home Bar**: Bottom navigation applies `padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px))` so navigation items never overlap phone system gestures.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST sanitize all routine and diet data inputs prior to rendering (ensuring `restTime`, `repetitions`, `sets`, `coachNotes`, `sportContext` are defensively validated as strings/objects).
- **FR-002**: System MUST provide a server-side redirect fallback in `/api/routines/[id]/pdf` and `/api/diets/[id]/pdf`: if headless browser generation encounters an environment failure, it MUST redirect with HTTP 307 to the client-printable preview route (`autoPrint=true`) rather than returning an unhandled HTTP 500 error.
- **FR-003**: System MUST provide dual explicit PDF actions on routine and diet cards:
  - "چاپ و پیش‌نمایش PDF" (direct native `target="_blank"` link that bypasses popup blockers).
  - "دانلود مستقیم PDF" (streamed download button with visual progress feedback).
- **FR-004**: System MUST render a floating glassmorphic mobile bottom navigation bar on viewports `< 1024px` (`rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xl`), docked above the device home bar with safe-area insets, automatically hidden on Live Workout routes (`/client/workout/*`) and printable PDF routes (`*/pdf`) to maximize execution focus.
- **FR-005**: Mobile bottom navigation MUST display role-appropriate tabs:
  - For Trainer: شاگردان (`/clients`), برنامه‌ها (`/routines`), تغذیه (`/diets`), پیام‌ها (`/messages`), پروفایل (`/profile`).
  - For Client: تمرین من (`/client`), پیشرفت (`/client/progress`), پیام‌ها (`/client/messages`), رژیم من (`/client/diets`).
- **FR-006**: Mobile bottom navigation MUST display dynamic unread message count badges with animated pulse for active messages.
- **FR-007**: Mobile navigation MUST include an animated hamburger icon featuring a 3-line to 'X' morphing transition using CSS transforms.
- **FR-008**: Mobile navigation drawer MUST include staggered entrance animations, accessible touch targets (minimum 44x44px), and background scroll lock (`overflow: hidden` on body when active).
- **FR-009**: System MUST update Workbox / Service Worker caching strategies in `next.config.mjs` / `public/sw.js` to ensure dynamic API routes and client detail routes are treated as Network-Only / Network-First with proper fallback handling, eliminating `Uncaught (in promise) no-response` errors.
- **FR-010**: All client detail cards, metrics, and calculator summaries MUST reflow seamlessly on screens down to 360px without horizontal page scrolling.
- **FR-011**: The printable PDF preview page (`/routines/[id]/pdf` and `/diets/[id]/pdf`) MUST support the `?autoPrint=true` query parameter to trigger `window.print()` automatically upon document load.
- **FR-012**: The user profile page (`/profile`) MUST remain accessible from both the desktop header dropdown, the mobile drawer, and the mobile bottom navigation bar.

---

### Key Entities

- **Routine**: Represents a workout routine containing `title`, `workoutDays`, `sportContext` (JSON), and relationship to `Trainer`.
- **Client**: Represents an athlete with anthropometric metrics, active subscriptions, routine history, and diet history.
- **NavigationItem**: Represents a primary or secondary navigation destination with `label`, `href`, `icon`, `isMessages` flag, and role authorization.
- **PdfExportContext**: Normalized view model containing validated trainer branding, client metadata, exercises, and coaching notes for fail-safe PDF rendering.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of PDF export attempts result in either a direct file download or an automated printable preview tab; zero unhandled HTTP 500 error dead ends.
- **SC-002**: Zero popup blocker interventions when opening the printable PDF preview across Chrome, Safari, and Firefox.
- **SC-003**: 100% mobile viewport compatibility on screen widths from 360px to 1920px with zero horizontal scroll bleed (`overflow-x: 0`).
- **SC-004**: Mobile hamburger menu open/close transitions execute in under 300ms at 60fps with smooth visual morphing.
- **SC-005**: Service worker console errors (`no-response / FetchEvent promise rejected`) eliminated completely on authenticated client pages.

---

## Assumptions

- Users may access the application on both mobile devices (smartphones, tablets) and desktop monitors.
- Linux VPS hosting environments may experience varying memory or Chromium sandbox restrictions; thus, hybrid PDF rendering (server Puppeteer buffer + client browser `@media print` fallback) is required for 100% operational uptime.
- Role-based access control (Trainer vs Client vs Super Admin) governs the items presented in bottom navigation and drawer navigation.
