# NutriTrain - Gym & Nutrition Management Platform
## Complete Setup & Workstation Sync Guide

This document contains full instructions for setting up NutriTrain on a new workstation (e.g., your work laptop) and syncing changes via GitHub.

---

## 1. Primary Repository Information
- **GitHub Repository URL**: `https://github.com/devmzarei-web/Gym-Scale.git`
- **Recommended Visibility**: Private

---

## 2. Pushing Local Changes from Current Machine to GitHub

Run these commands in your project directory (`h:\Work\Website\Gym-Scale`):

```bash
# Link your local repository to GitHub
git remote add origin https://github.com/devmzarei-web/Gym-Scale.git

# Set default branch to main
git branch -M main

# Push all committed code to GitHub
git push -u origin main
```

---

## 3. Setting Up on Work Laptop (First-Time Setup)

### Step A: Clone Repository & Install Dependencies
Open terminal on your work laptop and execute:

```bash
git clone https://github.com/devmzarei-web/Gym-Scale.git
cd Gym-Scale
npm install
```

---

### Step B: Install PostgreSQL Database
1. Download & Install [PostgreSQL for Windows](https://www.postgresql.org/download/windows/) (or run via Docker).
2. Note your PostgreSQL `postgres` user password set during installation.
3. Open pgAdmin or SQL Shell and create a new database named `nutritrain`.

---

### Step C: Environment Configuration (`.env`)
Create a file named `.env` in the root of the project directory with the following content:

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/nutritrain?schema=public"
AUTH_SECRET="nutritrain-super-secret-key-2026"
```
*(Replace `YOUR_POSTGRES_PASSWORD` with your actual local PostgreSQL password)*

---

### Step D: Initialize Database Schema & Seed Initial Data
Run the following two commands to automatically construct all tables, indexes, and seed initial accounts:

```bash
# Build all tables and schema in PostgreSQL
npx prisma db push

# Seed exercise dictionary & SuperAdmin account (admin@nutritrain.ir / Number05$)
npm run seed
```

---

### Step E: Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 4. Daily Workflow & Workstation Sync

### Before leaving a workstation (Push updates):
```bash
git add .
git commit -m "Update feature XYZ"
git push origin main
```

### When starting work on another laptop (Pull updates):
```bash
git pull origin main
npm run dev
```

---

## 5. SuperAdmin Account Credentials
- **Email**: `admin@nutritrain.ir`
- **Password**: `Number05$`
