# Phase 0 Research: Base-Level PDF Generation Resilience & Premium Mobile-First Experience

## Technical Strategy & Architectural Decisions

### 1. Root-Cause Analysis & Fix for PDF Generation & Download Failures

#### Problem Analysis
- On Linux VPS environments, Puppeteer Chromium processes can experience container resource constraints, Crashpad cpufreq hardware inspection errors, or missing X11/font dependencies.
- When an API route (`/api/routines/[id]/pdf`) throws an uncaught exception, Next.js returns an HTTP 500 error.
- In the client browser, when `fetch()` fails with a 500 status and code attempts to open a fallback tab via `window.open()` inside an asynchronous catch block, modern browsers (Chrome, Safari, Firefox) classify the popup as untrusted and **block it immediately** (Popup Blocker).
- Database normalization issues: older routines or AI-generated plans may have stringified JSON in `sportContext` (or null fields in `restTime`), which can cause runtime TypeErrors during string replacements.

#### Architectural Decision
1. **Server-Side Redirect Fallback (Zero 500 Dead-Ends)**:
   - In `/api/routines/[id]/pdf` and `/api/diets/[id]/pdf`, wrap Puppeteer generation in a resilient try/catch.
   - If buffer generation succeeds, stream the binary file with `Content-Disposition: attachment; filename=...`.
   - If buffer generation encounters any timeout or error, **immediately return an HTTP 307 Temporary Redirect** to `/routines/[id]/pdf?clientId=[id]&autoPrint=true`.
   - When the browser follows this standard redirect, it loads the client-printable preview page directly in the current window (or user's tab) and automatically triggers the native print dialog without any popup blocker interference.
2. **Defensive Data Normalization**:
   - Create a shared helper `normalizeRoutinePdfData(routine, client, trainer)` that safely parses `sportContext` whether it is an object, a string, or null.
   - Ensure all exercise fields (`restTime`, `repetitions`, `sets`) are safely converted using `String(...)` before running string operations.
3. **Explicit Dual Actions in UI**:
   - Update routine and diet cards on `/clients/[id]`, `/routines`, `/diets`, and `/client` to provide:
     - Direct native link: "چاپ و پیش‌نمایش PDF" (`<Link href="..." target="_blank">`) which is a standard anchor that never gets blocked.
     - Direct stream button: "دانلود مستقیم PDF" using `DownloadPdfButton` with progress state.
4. **Auto-Print Trigger on PDF Preview Page**:
   - In `/routines/[id]/pdf/page.tsx` and `/diets/[id]/pdf/page.tsx`, read `searchParams.autoPrint`.
   - If `autoPrint === "true"`, automatically invoke `window.print()` after initial render via a client trigger component.

---

### 2. Workbox / Service Worker Network Error Elimination

#### Problem Analysis
- Console displays: `The FetchEvent for ".../clients/..." resulted in a network error response: the promise was rejected` and `workbox: no-response`.
- Next-PWA / Workbox was configured to cache navigation routes or API calls with a strategy that failed to supply a valid response when dynamic authenticated SSR pages changed.

#### Architectural Decision
- Update `next.config.mjs` (or workbox runtime caching options) to explicitly set `NetworkOnly` for all dynamic API endpoints (`/api/*`) and authenticated SSR pages (`/clients/*`, `/routines/*`, `/diets/*`, `/profile/*`).
- Ensure navigation fallback does not attempt to serve cached static shell when user requests dynamic database-backed pages.

---

### 3. Floating Glassmorphic Mobile Bottom Navigation Bar

#### User Experience & Ergonomics
- Positioned in the mobile thumb zone (`bottom: 0`, fixed) for viewports `< 1024px` (`lg:hidden`).
- Floating island design: `mx-3 mb-2.5 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xl shadow-slate-900/5`.
- Safe area inset compensation: `padding-bottom: calc(0.35rem + env(safe-area-inset-bottom, 0px))`.
- Bottom page content clearance: add `pb-24` on main page containers on mobile so cards and buttons are never hidden behind the navigation pill.

#### Role-Based Tab Mapping
- **Trainer View**:
  1. شاگردان (`/clients` or `/` for trainer dashboard) - Icon: `Users`
  2. برنامه‌ها (`/routines`) - Icon: `Dumbbell`
  3. تغذیه (`/diets`) - Icon: `Utensils`
  4. پیام‌ها (`/messages`) - Icon: `MessageSquare` (with live pulsing unread badge)
  5. پروفایل (`/profile`) - Icon: `User` (direct access to trainer profile and custom logo upload)
- **Client View**:
  1. تمرین من (`/client`) - Icon: `Dumbbell`
  2. ثبت پیشرفت (`/client/progress`) - Icon: `TrendingUp`
  3. پیام‌ها (`/client/messages`) - Icon: `MessageSquare` (with live unread badge)
  4. رژیم من (`/client/diets` or active diet) - Icon: `Utensils`

#### Conditional Visibility
- Automatically hide the bottom navigation bar on:
  - Live Workout mode (`/client/workout/*`) to prevent collision with exercise timers and completion controls.
  - Printable PDF preview pages (`*/pdf`).
  - Auth / Login page (`/login`).

---

### 4. Amazingly Animated Luxury Hamburger Menu & Drawer

#### Design & Motion Principles
1. **Morphing Hamburger Icon**:
   - A 3-bar SVG/CSS icon button.
   - When toggled from closed to open:
     - Top bar rotates 45deg and translates down.
     - Middle bar opacity fades to 0 and scales down.
     - Bottom bar rotates -45deg and translates up.
   - Reverse animation executes smoothly on close.
2. **Glassmorphism Drawer Panel**:
   - Backdrop: `bg-slate-950/60 backdrop-blur-md` with fade-in transition.
   - Drawer container: slides in from RTL right (`translate-x-0` vs `translate-x-full`) with cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`).
3. **Staggered Entrance Animation**:
   - Menu items animate into view with staggered delay (`transition-delay: 50ms, 100ms, 150ms...`).
4. **Drawer Structure**:
   - Header: Brand logo + close button.
   - User Card: Trainer name, role badge, email, active tier.
   - Primary Navigation: All platform sections (شاگردان, برنامه‌ها, تغذیه, بانک حرکات, بانک غذا, دستورپخت‌ها, مدیریت سیستم).
   - Quick Action: Direct link to "پروفایل و آپلود لوگوی مربی" (`/profile`).
   - Footer: Version and platform branding.
5. **Ergonomic Controls**:
   - Outside tap to dismiss.
   - Swipe right to dismiss.
   - Escape key listener.
   - Body scroll locked when drawer is active.
