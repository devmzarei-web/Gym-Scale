# Feature Specification: Tiered Gym/Trainer Subscriptions & Responsive Single-Line Navigation

**Feature Branch**: `001-tiered-subscriptions-header-nav`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "i want to give this to a gym or a trainer and use the features, we should have tiered subscriptions so we could limit their usage, ui changes: 1- the header navigations should all be one single line of text rather than two, they should be responsive 2: same goes for the green profile dropdown"


---

## Clarifications

### Session 2026-10-06
- Q: What subscription tiers and usage quotas should be configured for gym owners and trainers? → A: 3 Preset Tiers: Trial (5 clients, 3 AI routines, 14-day validity), Starter (25 clients, 30 AI routines), Pro (100 clients, 100 AI routines), with SuperAdmin ability to override specific quotas.
- Q: What access level should a trainer or gym retain when their subscription reaches its expiration date (`expiresAt`)? → A: 3-day grace period with persistent renewal warning banner, followed by full lockout redirecting to an account renewal screen.
- Q: How should the header navigation adapt when screen space is too constrained to fit all menu items on a single line? → A: Responsive Hamburger Drawer: Below 1024px (tablets & phones), collapse navigation links into a slide-out drawer sheet; on screens >= 1024px, display all items in a single horizontal row with compact spacing and whitespace-nowrap.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tiered Gym/Trainer Subscription Limits & Gating (Priority: P1)

As a SuperAdmin or platform owner, I want to assign distinct subscription tiers (e.g. Demo/Trial, Starter Coach, Pro Gym) to gyms and trainers so that their client capacity, AI generation quota, and duration of access are strictly controlled and monetizable.

**Why this priority**: Directly solves the business objective of onboarding trial gym owners while preventing unbounded platform abuse, managing AI API expenses, and creating a path to paid subscription renewals.

**Independent Test**: Can be tested independently by logging in as SuperAdmin, setting a trainer's tier (e.g. Trial with limit of 5 clients and 3 AI routines), then logging in as that trainer to verify that adding a 6th client or 4th AI generation triggers an upgrade boundary notice.

**Acceptance Scenarios**:
1. **Given** a trainer with an active tier and a client limit of 10, **When** they have 10 active clients and try to add an 11th client, **Then** the system blocks the creation and displays a polite tier-limit notice prompting them to upgrade.
2. **Given** a trainer who has exhausted their monthly AI generation quota, **When** they request an AI workout or diet generation, **Then** the system informs them that their quota has been reached with the date of renewal or an upgrade prompt.
3. **Given** a trainer whose subscription date (`expiresAt`) has passed within 3 days, **When** they access the panel, **Then** they retain access but see a prominent persistent banner with remaining grace period and a link to renew on `nutritrain.ir`. **When** more than 3 days have elapsed post-expiration, **Then** the account is locked and redirected to an account renewal screen.
4. **Given** a SuperAdmin accessing the management dashboard, **When** inspecting any trainer account, **Then** the SuperAdmin can instantly change their tier, adjust their maximum client count, recharge their AI quota, or change their expiry date.

---

### User Story 2 - Single-Line Responsive Header Navigation (Priority: P2)

As a gym trainer or client browsing the panel on laptops, tablets, or mobile devices, I want all navigation items to remain clean, legible, and formatted on a single horizontal line of text without awkwardly wrapping into two vertical lines or breaking the header layout.

**Why this priority**: Fixes a visible visual defect where navigation titles wrap awkwardly into two lines on standard Persian UI fonts and responsive viewports, damaging perceived brand quality.

**Independent Test**: Can be tested independently by opening the panel on different screen resolutions (from 768px tablet to 1440px desktop) and verifying that no navigation item's text wraps onto a second line, and that horizontal overflow is handled cleanly via responsive display rules or mobile drawer.

**Acceptance Scenarios**:
1. **Given** a screen width >= 1024px (desktop/laptop), **When** viewing the top navigation bar, **Then** all menu item labels (e.g., "برنامه‌های تمرینی", "بانک مواد غذایی") display strictly on a single line of text (`whitespace-nowrap`).
2. **Given** a screen width < 1024px (tablets & mobile), **When** viewing the header, **Then** navigation items collapse into an accessible slide-out drawer (hamburger menu) rather than breaking the header height or wrapping into two lines.
3. **Given** an active route, **When** hovering or clicking a navigation link, **Then** the link retains its single-line height and active highlight without layout shift.

---

### User Story 3 - Single-Line Responsive Profile Dropdown (Priority: P3)

As a trainer, gym owner, or admin with a long full name or gym title, I want the green header profile dropdown button to stay on a single line with clean truncation, consistent height, and responsive behavior.

**Why this priority**: Eliminates layout distortion caused by long user names (e.g. "مدیر ارشد سیستم" or long gym names) expanding the profile button vertically and misaligning header items.

**Independent Test**: Can be tested independently by logging in with a long account name and verifying the green profile button remains vertically aligned, single-lined, and displays an ellipsis with clean dropdown menu animations.

**Acceptance Scenarios**:
1. **Given** a trainer with a long name (e.g. "استاد علیرضا محمودیان باشگاه پارس"), **When** the header renders, **Then** the green dropdown button maintains a fixed single-line height, gracefully truncating the text with an ellipsis while keeping the icon and chevron aligned.
2. **Given** any screen size, **When** clicking the profile button, **Then** the dropdown menu opens directly beneath it without causing any horizontal overflow or page horizontal scrolling.

---

### Edge Cases

- **Trainer downgraded with excess clients**: If a trainer is downgraded from Pro (50 clients) to Starter (10 clients) while having 20 existing clients, existing client data is preserved in read/edit mode, but new client addition is restricted until client count drops below limit or plan is upgraded.
- **AI generation during quota boundary**: If an AI request fails midway due to external API errors, the user's quota must NOT be decremented.
- **RTL Persian text truncation**: Single-line text truncation in RTL layout must render the ellipsis (`...`) on the correct left end without reversing text direction.
- **Tablets and Mobile viewports (< 1024px)**: The header links collapse smoothly into a slide-out drawer while the logo, hamburger trigger, and profile dropdown remain single-line and accessible.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support configurable subscription tiers for trainers and gym accounts (e.g. Free/Trial, Coach Starter, Gym Pro).
- **FR-002**: Each subscription tier MUST define explicit limits for:
  - Maximum active clients allowed (`maxClients`)
  - Monthly AI routine & diet generation quota (`aiQuota`)
  - Access to advanced modules (e.g., Recipe bank, diet builder, custom gym branding)
- **FR-003**: The system MUST enforce client creation limits: when a trainer attempts to create a new client and has reached their tier's limit, the action MUST be prevented with a clear user-friendly explanation and upgrade prompt.
- **FR-004**: The system MUST enforce AI quota limits: when a trainer's remaining quota is zero, AI generation triggers MUST display a quota exhausted alert indicating the reset date.
- **FR-005**: The system MUST enforce subscription expiration: accounts past expiration MUST enter a 3-day grace period with persistent renewal warnings; after 3 days elapsed, the account MUST be fully locked and redirected to an account renewal screen linking to `nutritrain.ir`.
- **FR-006**: SuperAdmin MUST have an interface in `/admin` to modify any trainer's tier, client limit, AI quota, and expiration date at any time.
- **FR-007**: Trainers MUST be able to view their current tier status, remaining client slots, and remaining AI quota within their dashboard/profile.
- **FR-008**: All header navigation link items MUST be styled with strict single-line text constraints (`whitespace-nowrap`) preventing multi-line text wrapping on all viewports.
- **FR-009**: The header navigation MUST be responsive: on screens >= 1024px, all items render inline on a single horizontal row; on screens < 1024px (tablets & phones), items MUST collapse into an accessible slide-out navigation drawer (hamburger menu).
- **FR-010**: The green profile dropdown button in the header MUST be strictly constrained to a single line, truncating long names cleanly with an ellipsis (`truncate`) without expanding header height.

### Key Entities

- **Trainer / Gym Account**: Represents the gym owner or coach holding a subscription. Attributes include `tier` (Free, Starter, Pro), `maxClients` (integer limit), `aiQuota` (available generations), `expiresAt` (plan expiry timestamp), and permission flags (`canCreateDiets`, `canCreateRoutines`, `canAccessRecipes`).
- **Subscription Tier Definition**: Preset tier configurations defining default quotas, client limits, and feature permissions.
- **Client**: Athlete registered under a trainer, counting toward the trainer's active client quota.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of header navigation items and the green profile dropdown render on a single line of text across all tested screen widths (375px, 768px, 1024px, 1280px, 1440px).
- **SC-002**: A trainer at their client capacity is prevented from creating new clients in under 1 second with a clear Persian explanation.
- **SC-003**: SuperAdmin can upgrade or modify a gym's tier and quotas in under 3 clicks from the admin panel.
- **SC-004**: Zero visual height jitter or layout shifts in the header when resizing between desktop and tablet viewport widths.

---

## Assumptions

- Subscriptions for trainers are managed in this phase via SuperAdmin assignment or trial defaults, with direct upgrade links pointing back to `https://nutritrain.ir`.
- Default tier presets:
  - **آزمایشی (Trial/Demo)**: 5 شاگرد | ۳ سهمیه هوش مصنوعی | اعتبار ۱۴ روز
  - **مربی پایه (Coach Starter)**: ۲۵ شاگرد | ۳۰ سهمیه هوش مصنوعی | اعتبار ۱ تا ۱۲ ماه
  - **باشگاه حرفه‌ای (Gym Pro)**: ۱۰۰ شاگرد (یا نامحدود) | ۱۰۰ سهمیه هوش مصنوعی | اعتبار ۱ تا ۱۲ ماه
- Header links will collapse into a clean slide-out drawer on tablet and mobile viewports (< 1024px) and display in a single row on desktop viewports (>= 1024px).
