# 🚀 Gym-Scale Production VPS Deployment Guide

This guide walks you through setting up **Gym-Scale (NutriTrain)** on an Ubuntu/Debian VPS with **Node.js 20+**, **PostgreSQL**, **PM2**, **Nginx**, and **Certbot (SSL)**.

---

## 1. System Requirements & Dependencies

Connect to your VPS via SSH:
```bash
ssh root@YOUR_SERVER_IP
```

Update system packages and install required tools:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw
```

### Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v # Should output v20.x.x
npm -v
```

### Install PM2 Globally
```bash
sudo npm install -g pm2
```

### Install Linux Puppeteer & Chromium Dependencies
Since the platform generates PDF workout and diet routines using Puppeteer, install the required shared libraries:
```bash
sudo apt install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
  libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
  libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
  libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libxss1 libxtst6 lsb-release wget xdg-utils
```

---

## 2. PostgreSQL Setup

Install PostgreSQL:
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Create a database and user:
```bash
sudo -u postgres psql
```

Inside the PostgreSQL prompt (`postgres=#`):
```sql
CREATE DATABASE nutritrain_db;
CREATE USER gymscale_user WITH ENCRYPTED PASSWORD 'YourStrongDbPasswordHere';
GRANT ALL PRIVILEGES ON DATABASE nutritrain_db TO gymscale_user;
ALTER DATABASE nutritrain_db OWNER TO gymscale_user;
\q
```

---

## 3. Clone Repository & Setup Project

Navigate to your web directory (e.g. `/var/www`):
```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/devmzarei-web/Gym-Scale.git
cd Gym-Scale
```

Give appropriate directory permissions:
```bash
sudo chown -R $USER:$USER /var/www/Gym-Scale
```

Make scripts executable:
```bash
chmod +x scripts/deploy.sh
```

---

## 4. Configure Environment Variables

Copy the template:
```bash
cp .env.example .env
nano .env
```

Fill in your actual production values:
```env
# PostgreSQL
DATABASE_URL="postgresql://gymscale_user:YourStrongDbPasswordHere@127.0.0.1:5432/nutritrain_db?schema=public"

# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secure-random-32-byte-secret"

# Your domain (HTTPS)
AUTH_URL="https://yourdomain.com"
NEXTAUTH_URL="https://yourdomain.com"

# Initial SuperAdmin credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="YourStrongAdminPassword"

# GapGPT or OpenAI API Key for routine generation
GAPGPT_API_KEY="sk-..."
GAPGPT_BASE_URL="https://api.gapgpt.app/v1"

NODE_ENV="production"
PORT=3000
```
Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

## 5. Install Dependencies, Migrate Database & Seed

```bash
# 1. Install packages
npm install

# 2. Push schema to PostgreSQL
npx prisma db push

# 3. Seed initial exercise bank, food dictionary, and SuperAdmin account
npm run seed

# 4. Build Next.js production bundle
npm run build
```

---

## 6. Run Application with PM2

Start the application with our preconfigured PM2 configuration:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
*(Copy and run the `sudo env PATH=...` command that `pm2 startup` gives you so PM2 starts automatically on server reboots).*

Check status:
```bash
pm2 status
pm2 logs gym-scale
```

---

## 7. Setup Nginx & Free SSL (Let's Encrypt)

### Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Configure Virtual Host
Copy our configuration:
```bash
sudo cp nginx/gym-scale.conf /etc/nginx/sites-available/gym-scale
```

Edit the file to replace `yourdomain.com` with your real domain:
```bash
sudo nano /etc/nginx/sites-available/gym-scale
```

Enable the site and verify syntax:
```bash
sudo ln -s /etc/nginx/sites-available/gym-scale /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Install SSL Certificate with Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Certbot will automatically modify your Nginx configuration to enable HTTPS and HTTP-to-HTTPS redirect.

---

## 8. Configure Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 9. Future Updates & Continuous Deployment

Whenever you push new code to GitHub, simply SSH into your VPS and run:
```bash
cd /var/www/Gym-Scale
./scripts/deploy.sh
```
This script handles:
1. `git pull`
2. `npm install`
3. `prisma db push`
4. `npm run build`
5. Zero-downtime `pm2 reload`
