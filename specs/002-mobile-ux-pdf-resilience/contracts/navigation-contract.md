# Contract: Responsive Navigation & Mobile UI Specification

## 1. Breakpoint Architecture

- **Desktop (`>= 1024px`)**:
  - Horizontal top navigation bar visible in header (`lg:flex`).
  - Mobile bottom navigation bar hidden (`lg:hidden`).
  - Animated hamburger button hidden (`lg:hidden`).
  - User avatar dropdown active in top header.

- **Mobile & Tablet (`< 1024px`)**:
  - Horizontal top navigation hidden.
  - Animated morphing hamburger button visible in top header.
  - Floating glassmorphic bottom navigation bar docked above safe area.
  - Main page content container applies bottom clearance (`pb-28`).

- **Excluded Routes for Mobile Bottom Bar**:
  - `/client/workout/*` (Live workout execution mode).
  - `*/pdf*` (Printable document preview).
  - `/login` (Authentication entry).

---

## 2. Navigation Item Mapping

### Trainer Role
| Tab Key | Label | Route | Icon | Badges |
|---|---|---|---|---|
| `clients` | شاگردان | `/clients` | `Users` | None |
| `routines` | برنامه‌ها | `/routines` | `Dumbbell` | None |
| `diets` | تغذیه | `/diets` | `Utensils` | None |
| `messages` | پیام‌ها | `/messages` | `MessageSquare` | Live unread counter |
| `profile` | پروفایل | `/profile` | `User` | None |

### Client Role
| Tab Key | Label | Route | Icon | Badges |
|---|---|---|---|---|
| `workout` | تمرین من | `/client` | `Dumbbell` | None |
| `progress` | پیشرفت | `/client/progress` | `TrendingUp` | None |
| `messages` | پیام‌ها | `/client/messages` | `MessageSquare` | Live unread counter |
| `diet` | رژیم من | `/client` (or `/client/diets`) | `Utensils` | None |
