# NutriTrain (Gym-Scale) - Features, Architecture & Production Deployment Blueprint

> **File Summary**: Authoritative reference document auditing all implemented features, performance & QoS optimizations, security measures, premium feature roadmap, storefront architecture (`NutriTrain.ir`), and step-by-step Linux VPS deployment & Postgres database migration guide for `panel.NutriTrain.ir`.

---

## 📋 Table of Contents

1. [Executive Summary & Technology Stack](#1-executive-summary--technology-stack)
2. [Comprehensive Feature & QoS Audit](#2-comprehensive-feature--qos-audit)
3. [Performance, Efficiency & Scalability Engineering](#3-performance-efficiency--scalability-engineering)
4. [Security Audit & Hardening Matrix](#4-security-audit--hardening-matrix)
5. [Production Readiness & Premium Roadmap](#5-production-readiness--premium-roadmap)
6. [Storefront vs. App Panel Architecture (`NutriTrain.ir` vs `panel.NutriTrain.ir`)](#6-storefront-vs-app-panel-architecture)
7. [Linux VPS Deployment & Database Migration Guide](#7-linux-vps-deployment--database-migration-guide)

---

## 1. 🚀 Executive Summary & Technology Stack

**NutriTrain** is an enterprise-grade SaaS web platform and PWA designed for personal trainers, fitness coaches, gym clients, and super administrators. It combines AI-powered diet generation, real-time messaging, workout tracking, macro-equivalent food substitution, and subscription management into a unified Persian (RTL) interface.

### 🛠️ Core Technology Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Database & ORM**: PostgreSQL / SQLite + Prisma ORM
- **Authentication**: NextAuth.js v5 Beta (Credentials + JWT + Custom RBAC)
- **Styling & Motion**: Tailwind CSS v4 + Framer Motion + Lucide Icons
- **PDF Engine**: Server-Side Puppeteer HTML-to-PDF Renderer
- **AI Integration**: GapGPT API (GPT-4o Mini) + Simulated Scientific Local Fallback Engine
- **PWA**: `@ducanh2912/next-pwa` Service Worker

---

## 2. 📋 Comprehensive Feature & QoS Audit

### A. 🔐 Authentication, Access Control & Subscription Tiers

- **Role-Based Access Control (RBAC)**: Strict permission boundaries for `SUPER_ADMIN`, `TRAINER`, and `CLIENT`.
- **Trainer Tiering System**:
  - `FREE`: Base tier with limited client slots and AI quota.
  - `PRO`: Mid-tier with expanded client slots and increased AI diet generation quotas.
  - `VIP`: Top tier with unlimited client capacity and maximum AI diet generation quota.
- **AI Quota Manager**: Automated quota check and decrement logic upon successful diet generation, with automated monthly quota reset (`aiQuotaResetAt`).
- **Security Recovery**: Security Questions & Answers for password reset verification + Bcrypt hashing.

### B. 🧠 Smart AI & Structured Diet Builder (`/diets/new`)

- **GapGPT AI Generator**: Generates scientific 5-meal daily diets tailored to calorie, protein, carb, and fat targets.
- **Scientific Fallback Engine**: If AI network APIs are unreachable, a local algorithm scales standard macro meals to match exact target calories without failing.
- **Physical Stats Auto-Fill**: Selecting an athlete automatically pulls their stored weight, height, age, and fitness goals into the planner fields.
- **Structured JSON Storage (`sectionsJson`)**: Diets are stored both as structured JSON (sections, rows, macros) and rendered HTML for maximum client-side flexibility and legacy compatibility.

### C. 🔄 Equivalent Food Substitution Engine ("جایگزین غذایی")

- **Smart Category Auto-Detection**: Dynamically analyzes the dominant macronutrient of any assigned meal row (Protein, Carbs, Fats, Vegetables/Fruits).
- **Macro-Matched Filtering**: Automatically filters food options to display _only_ recommended foods from the matching macro group (e.g. replacing chicken breast shows turkey, salmon, beef, eggs, tuna).
- **Proportional Portion Calculator**: Computes mathematically exact target portion weights (grams or unit count) required to hit identical calorie targets.
- **Interactive Athlete View**: Athletes can click the `🔄 جایگزین` button directly on their active diet rows.

### D. 💬 Real-Time Chat System (`/client/messages`, `/messages`)

- **Server-Sent Events (SSE)**: Streaming endpoint `/api/messages/stream` for real-time messaging between athlete and trainer.
- **Connection Query Locking**: Added query locks (`isQuerying`) and optimized polling intervals (5000ms) to prevent database connection pool exhaustion under concurrent athlete loads.

### E. 🏋️‍♂️ Multi-Plan & Routine Management (`/client`, `/clients/[id]`)

- **Athlete Multi-Plan Selector**: Athletes with multiple assigned diets or routines see a compact header badge (`همه برنامه‌ها (N) ▾`) and can click any title to open a full modal switcher to view or download PDFs for any plan.
- **Trainer Client CRM**: Trainers can view all assigned diets and routines for a client as an organized list, with one-click `🗑️ حذف تخصیص` (Unassign) capabilities.

### F. 📄 Puppeteer PDF Export Engine (`/api/diets/[id]/pdf`, `/api/routines/[id]/pdf`)

- Produces printable PDF document exports for athlete routines and diet plans.
- Direct PDF download buttons integrated into athlete dashboards and trainer CRM views.

### G. 🍎 Food Bank & Recipe Library (`/recipes`, `/api/client/food-bank`)

- Centralized dictionary of foods with per-100g macro breakdowns (Calories, Protein, Carbs, Fats).
- Expanded with comprehensive vegetable and fruit entries for healthy diet composition.

---

## 3. ⚡ Performance, Efficiency & Scalability Engineering

| Area                        | Optimization Technique Implemented                                  | Benefit & QoS Result                                                                     |
| :-------------------------- | :------------------------------------------------------------------ | :--------------------------------------------------------------------------------------- |
| **Real-Time SSE Streaming** | Single-query locking (`isQuerying`) + 5s throttle                   | Eliminates DB connection starvation under concurrent client connections.                 |
| **Diet Data Model**         | Dual storage (`sectionsJson` + HTML fallback)                       | Fast JSON component rendering for interactive tables without regex parsing HTML.         |
| **Soft Delete Guards**      | Global `isDeleted: false` filters in Prisma queries                 | Excludes deleted clients from reports, CRM lists, and auto-fills without hard data loss. |
| **Multi-Plan UI Rendering** | Client-side modal switcher using cached props                       | Prevents re-fetching full pages when switching between active plans.                     |
| **Database Queries**        | Explicit field selection (`select: { age, weight, height, goals }`) | Minimizes payload sizes over network wires and eliminates missing props bugs.            |

---

## 4. 🛡️ Security Audit & Hardening Matrix

### Implemented Security Features

- ✅ **Bcrypt Hashing**: All user passwords stored with salt rounds.
- ✅ **NextAuth JWT Sessions**: Session tokens encrypted and verified via `AUTH_SECRET`.
- ✅ **Middleware Route Protection**: Prevents unauthenticated access to `/admin`, `/trainer`, `/client` routes.
- ✅ **Soft-Delete Data Protection**: Prevents accidental data destruction.

### Production Hardening Requirements (Pre-Deployment Checklist)

- [ ] **Rate Limiting**: Integrate `@upstash/ratelimit` or express rate limiting on `/api/auth`, `/api/ai/generate-diet`, and `/api/messages`.
- [ ] **CORS & Security Headers**: Configure Next.js headers (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`).
- [ ] **HTTPS Enforcement**: SSL/TLS certificate via Let's Encrypt certbot on Nginx.
- [ ] **Database Connection SSL**: Enforce `sslmode=require` in PostgreSQL connection strings.

---

## 5. 🔮 Production Readiness & Premium Roadmap

### High-Priority Premium Features to Implement

1. **Progressive Overload Analytics**:
   - Track 1RM (One Rep Max) estimates and volume (`Sets × Reps × Weight`) over time with Recharts line graphs.
2. **In-Workout Live Rest Timer**:
   - Countdown timer overlay during live client workouts with audio beep alerts and phone vibration.
3. **Automated Push / SMS Notifications (Kavenegar / SMS.ir)**:
   - Automated alerts for subscription expiry (3 days prior), daily workout reminders, and unread trainer messages.
4. **Weekly Athlete Check-In Form**:
   - Structured check-in form for adherence %, energy level (1-10), sleep quality, and weekly physique photo uploads.
5. **Integrated Payment Gateways (ZarinPal / IDPay / Stripe)**:
   - Self-service online trainer subscription purchasing and automated renewal.

---

## 6. 🌐 Storefront vs. App Panel Architecture

To create a professional SaaS brand identity, the architecture is split into two distinct subdomains:

```
                  ┌─────────────────────────────────────────┐
                  │              NutriTrain.ir              │
                  │   Main Landing & Storefront Website     │
                  └────────────────────┬────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│     NutriTrain.ir     │                             │  panel.NutriTrain.ir  │
│  Storefront Landing   │ ─── [ "ورود / ثبت‌نام" ] ───►│    Next.js SaaS App   │
│  (Marketing & Plans)  │                             │  (Trainer & Athlete)  │
└───────────────────────┘                             └───────────────────────┘
```

### Storefront Landing Page Requirements (`NutriTrain.ir`)

- **Hero Section**: Modern typography, platform highlights, interactive demo preview mockup.
- **Feature Showcase**: AI diet generator, workout tracker, athlete mobile view, PDF exports.
- **Pricing Tiers**: Display `FREE`, `PRO`, and `VIP` plans with feature comparison matrix.
- **Call To Action (CTA)**: "شروع نسخه آزمایشی" / "ورود به پنل مربیان" linking to `https://panel.NutriTrain.ir/login`.

---

## 7. 🐧 Linux VPS Deployment & Database Migration Guide

This guide details deploying the application on your Linux VPS running Nginx, PM2, and PostgreSQL alongside existing websites.

---

### Step 1: VPS Environment Setup & PostgreSQL Database Creation

Log into your VPS via SSH and connect to PostgreSQL:

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create Database and User
CREATE DATABASE nutritrain_db;
CREATE USER nutritrain_user WITH PASSWORD 'This7Is7NutriTrain7';
GRANT ALL PRIVILEGES ON DATABASE nutritrain_db TO nutritrain_user;
\q
```

---

### Step 2: Database Migration (Local to VPS PostgreSQL)

#### Option A: Prisma Schema Push (Clean Production Setup)

Update `.env` on your server with the production connection string:

```env
DATABASE_URL="postgresql://nutritrain_user:YourSecurePasswordHere@localhost:5432/nutritrain_db?schema=public"
```

Push your schema and seed default data:

```bash
npx prisma db push
npx prisma db seed # Or run custom seed script for foods & dictionary
```

#### Option B: Transferring Local Database Data

If migrating from local PostgreSQL to VPS PostgreSQL:

```bash
# On Local Machine (Export):
pg_dump -U postgres -d local_gymscale_db -F c -b -v -f nutritrain_dump.bak

# Upload to VPS via SCP:
scp nutritrain_dump.bak user@your-vps-ip:/home/user/

# On VPS (Import):
pg_restore -U nutritrain_user -d nutritrain_db -v nutritrain_dump.bak
```

---

### Step 3: PM2 Process Setup for Next.js App

Clone or upload your code to `/var/www/panel.NutriTrain.ir`:

```bash
cd /var/www/panel.NutriTrain.ir

# Install production dependencies & build
npm install --production=false
npx prisma generate
npm run build

# Start with PM2 on port 3001
pm2 start npm --name "nutritrain-panel" -- PORT=3021 -- run start

# Save PM2 process list so it restarts on VPS reboot
pm2 save
pm2 startup
```

---

### Step 4: Nginx Reverse Proxy Configuration

Create Nginx server blocks for both subdomains in `/etc/nginx/sites-available/`:

#### 1. App Panel (`/etc/nginx/sites-available/panel.NutriTrain.ir`):

```nginx
server {
    server_name panel.NutriTrain.ir;

    location / {
        proxy_pass http://127.0.0.1:3021;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Support SSE Streaming for Chat
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
```

#### 2. Main Storefront (`/etc/nginx/sites-available/NutriTrain.ir`):

```nginx
server {
    server_name NutriTrain.ir www.NutriTrain.ir;

    location / {
        proxy_pass http://127.0.0.1:3000; # Or static HTML path if static
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the Nginx configurations:

```bash
sudo ln -s /etc/nginx/sites-available/panel.NutriTrain.ir /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/NutriTrain.ir /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 5: SSL Certificate Installation (Let's Encrypt Certbot)

Run Certbot to enable HTTPS automatically for both domains:

```bash
sudo certbot --nginx -d NutriTrain.ir -d www.NutriTrain.ir -d panel.NutriTrain.ir
```

Certbot will update the Nginx configurations with SSL certificates and auto-renew them via systemd timers.

---

_Document compiled and updated for the NutriTrain (Gym-Scale) project._
