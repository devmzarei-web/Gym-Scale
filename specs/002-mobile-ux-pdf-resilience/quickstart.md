# Quickstart Guide: Mobile UX & Resilient PDF Verification

## Verification Checklist

### 1. Test Mobile Bottom Navigation & Animated Hamburger
1. Open Chrome DevTools (`F12`), toggle device toolbar (`Ctrl+Shift+M`), select mobile preset (e.g. Pixel 7 / iPhone 14 Pro, width: 390px - 412px).
2. Log in as a Trainer.
3. Verify the floating bottom navigation bar appears docked above the bottom edge.
4. Tap through tabs:
   - "شاگردان" → navigates to `/clients`.
   - "برنامه‌ها" → navigates to `/routines`.
   - "تغذیه" → navigates to `/diets`.
   - "پیام‌ها" → navigates to `/messages`.
   - "پروفایل" → navigates to `/profile` (where logo upload is located).
5. Tap the animated Hamburger button in the header:
   - Notice the 3 lines morph smoothly into an 'X'.
   - The off-canvas drawer slides in from the right with glassmorphic blur.
   - Menu links animate into view with staggered reveals.
   - Tap outside or tap the 'X' to close.

### 2. Verify Client Live Workout Bottom Bar Exclusion
1. Navigate to `/client/workout/[id]`.
2. Confirm the bottom navigation bar is completely hidden so exercise timers and "پایان تمرین" button have 100% of the screen.

### 3. Verify PDF Export & Resilient Fallback
1. Go to any client detail page (`/clients/[id]`).
2. Notice the dual action buttons for both Workout and Diet cards:
   - **چاپ و پیش‌نمایش PDF**: Native link that opens in a new tab without popup blocker.
   - **دانلود مستقیم PDF**: Attempts streamed download. If server PDF engine encounters an exception or timeout, it automatically redirects (307) to the printable preview page with `autoPrint=true`.
3. Confirm zero 500 error dead ends in the browser console.
