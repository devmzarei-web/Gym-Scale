# Quickstart & Verification Guide: Tiered Subscriptions & Responsive Header Navigation

**Feature**: `001-tiered-subscriptions-header-nav`  
**Date**: 2026-10-06  

---

## Prerequisites
1. Local PostgreSQL running with schema updated via Prisma (`npm run db:push`).
2. Local dev server running on `http://localhost:3000` (or `3020`).
3. Seeded SuperAdmin: `admin-nutri@nutritrain.ir` / `Number05`.

---

## Scenario 1: Responsive Single-Line Header Verification
1. **Desktop Test (`1440px` and `1024px`)**:
   - Open browser developer tools and navigate to `/`.
   - Verify all 7–8 menu items ("شاگردان من", "برنامه‌های تمرینی", "بانک مواد غذایی", etc.) display on a single horizontal row (`whitespace-nowrap`).
   - Check that text never breaks or wraps onto a second row.
2. **Profile Dropdown Button Test**:
   - Log in with an account having a long name (or edit profile to e.g. "باشگاه بدنسازی قهرمانان البرز").
   - Inspect the green dashboard button in the header.
   - Verify the button remains strictly single-line, neatly truncated with an ellipsis (`...`), maintaining consistent navbar height.
3. **Mobile & Tablet Drawer Test (`768px` and `375px`)**:
   - Resize viewport below `1024px`.
   - Verify header items collapse into the hamburger menu icon.
   - Click the hamburger icon to verify the slide-out navigation sheet opens smoothly, lists all links, shows badges, and navigates cleanly without horizontal page scroll.

---

## Scenario 2: Tier Quota & Client Limit Gating
1. **SuperAdmin Tier Configuration**:
   - Log in as SuperAdmin at `/admin`.
   - Select a demo trainer and assign them tier **آزمایشی (Trial)** with `maxClients = 5`.
2. **Enforcement Verification**:
   - Log in as that trainer.
   - Create 5 clients successfully.
   - Attempt to add a 6th client.
   - **Expected Result**: System rejects the action and displays:
     *"ظرفیت شاگردان شما در پلن فعلی تکمیل شده است (حداکثر ۵ شاگرد). جهت افزودن شاگرد بیشتر، اشتراک خود را ارتقا دهید."*

---

## Scenario 3: Subscription Expiration & Grace Period Lifecycle
1. **Grace Period Test**:
   - As SuperAdmin, set the trainer's `expiresAt` to 1 day in the past.
   - Log in as that trainer.
   - **Expected Result**: Access to the dashboard is allowed, but a warning banner appears at the top:
     *"اشتراک شما به پایان رسیده است و در مهلت ۳ روزه تمدید هستید. جهت جلوگیری از قفل شدن حساب کاربری، اشتراک خود را تمدید فرمایید."* with a link to `https://nutritrain.ir`.
2. **Full Lockout Test**:
   - As SuperAdmin, set the trainer's `expiresAt` to 4 days in the past (> 3-day grace period).
   - Log in as that trainer.
   - **Expected Result**: Redirected to `/subscription-expired` displaying lockout notice and renewal button.
