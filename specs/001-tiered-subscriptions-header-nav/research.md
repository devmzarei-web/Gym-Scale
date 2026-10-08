# Research & Architecture Decisions: Tiered Subscriptions & Responsive Single-Line Navigation

**Feature**: `001-tiered-subscriptions-header-nav`  
**Date**: 2026-10-06  
**Status**: Approved  

---

## 1. Subscription Tier Model & Database Schema

### Decision
Extend the Prisma `TrainerTier` enum to support `TRIAL`, `STARTER`, and `PRO` (retaining `FREE` for backward compatibility, mapped to `TRIAL`). Standardize default quotas and validation helper functions in `@/lib/subscription.ts`.

### Preset Tier Configurations
| Tier | Display Name (FA) | Default Max Clients | Default AI Quota | Default Validity | Advanced Features |
|---|---|---|---|---|---|
| `TRIAL` / `FREE` | آزمایشی | 5 شاگرد | ۳ برنامه در ماه | ۱۴ روز | روتین، تغذیه، رسپی |
| `STARTER` | مربی پایه | ۲۵ شاگرد | ۳۰ برنامه در ماه | ۳۰ روز | تمام دسترسی‌ها |
| `PRO` | باشگاه حرفه‌ای | ۱۰۰ شاگرد | ۱۰۰ برنامه در ماه | ۳۰ / ۳۶۵ روز | تمام دسترسی‌ها |

### Rationale
- Using Prisma enum + explicit integer columns (`maxClients`, `aiQuota`) on the `Trainer` model allows preset defaults upon tier selection, while enabling SuperAdmin to easily apply individual overrides (e.g. giving a VIP coach 150 clients or 50 AI generations) without altering the schema.
- Retaining `FREE` alongside `TRIAL` ensures zero database downtime or migration failure on existing PostgreSQL records in production.

### Alternatives Considered
- *Separate `SubscriptionTier` database table with foreign key*: Rejected as premature complexity (YAGNI). Three enum presets with overrides on `Trainer` cover 100% of current requirements without complex relational joins.

---

## 2. Subscription Expiration Lifecycle & Enforcement

### Decision
Implement a pure helper `getTrainerSubscriptionState(trainer: { expiresAt: Date | null, ... })` returning:
1. `ACTIVE`: When `expiresAt == null` (unlimited admin/demo) or `now <= expiresAt`.
2. `GRACE_PERIOD`: When `now > expiresAt` AND `now <= expiresAt + 3 days` (72 hours). User has full access to view existing data, but creation actions are blocked, and a top warning banner is displayed.
3. `LOCKED`: When `now > expiresAt + 3 days`. User is redirected to `/subscription-expired` with a clear message and renewal link to `https://nutritrain.ir`. SuperAdmin accounts and `/login` / signout routes are exempted.

### Gating Points
- **Client Creation (`createClient`)**: Checks `activeClientCount < trainer.maxClients` and `state !== 'LOCKED'`. If limit reached, throws user-friendly Persian error.
- **AI Routines & Diets (`generate-routine`, `generate-diet`)**: Checks `trainer.aiQuota > 0` and `state !== 'LOCKED'`.
- **Page Access**: Layout check renders persistent warning banner during `GRACE_PERIOD`, and redirects to `/subscription-expired` if `LOCKED`.

---

## 3. Responsive Header Navigation & Single-Line Architecture

### Decision
1. **Desktop Viewport (`>= 1024px` / `lg`)**:
   - Apply `whitespace-nowrap` to all link items.
   - Adjust horizontal padding and text size (`px-2.5 py-1.5 text-xs`) and gap (`gap-1`) so that all 8 navigation items fit comfortably in a single row without wrapping.
2. **Tablet & Mobile Viewport (`< 1024px`)**:
   - Hide desktop navigation strip (`hidden lg:flex`).
   - Add a mobile hamburger button (`lg:hidden`) next to the brand logo.
   - Provide a slide-out navigation sheet drawer that renders all items vertically with icons, active state indicators, and message notification badges.
3. **Profile Dropdown Button (`NavbarUserDropdown`)**:
   - Enforce `whitespace-nowrap shrink-0` on button and text container.
   - Add `max-w-[120px] sm:max-w-[160px] truncate` to user name span to gracefully handle long Persian gym or coach names (e.g. "استاد علیرضا محمودیان باشگاه پارس") with an ellipsis, preventing header height expansion.

### Alternatives Considered
- *Horizontal drag-scroll bar on desktop*: Rejected because Persian desktop users expect full menu visibility; scrolling hides critical links like "بانک حرکات".
- *Dropdown "More" menu on desktop*: Unnecessary once tablet/mobile collapses to hamburger at `< 1024px` and desktop uses compact padding.

---

## 4. SuperAdmin Management Experience

### Decision
Update `/admin` trainer management dialogs (`add-trainer-modal.tsx`, `trainer-table-actions.tsx`) with:
- Tier selector dropdown (`آزمایشی`, `مربی پایه`, `باشگاه حرفه‌ای`) that auto-populates `maxClients`, `aiQuota`, and sets `expiresAt` automatically.
- Direct input fields allowing SuperAdmin to override any quota, client limit, or extend `expiresAt` by N days/months.
- Visual badge indicating tier and status (`فعال`, `مهلت ۳ روزه`, `منقضی شده`).
