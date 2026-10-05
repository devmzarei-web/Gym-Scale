#!/usr/bin/env bash
# ==============================================================================
# Gym-Scale Automated VPS Setup Script
# Ubuntu / Debian
# This script installs Node.js, PostgreSQL, PM2, Nginx, Puppeteer dependencies,
# creates your database, generates your .env file, seeds data, builds Next.js,
# and starts the service behind Nginx.
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}      🏋️ Gym-Scale (NutriTrain) VPS Setup Wizard       ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check if script is run as root or sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run this script with sudo or as root:${NC}"
  echo "sudo bash scripts/setup-vps.sh"
  exit 1
fi

REAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(eval echo ~$REAL_USER)

echo -e "\n${YELLOW}Step 1: Gathering Configuration Info${NC}"
echo "------------------------------------------------------"

# 1. Domain or IP
read -p "Enter your Domain name or VPS IP (e.g., gym.example.com or 194.31.x.x): " DOMAIN_OR_IP
while [ -z "$DOMAIN_OR_IP" ]; do
  read -p "Domain or IP is required: " DOMAIN_OR_IP
done

# 2. Database Password
DEFAULT_DB_PASS=$(openssl rand -hex 12)
read -p "Enter PostgreSQL password for 'gymscale_user' [Press Enter to auto-generate]: " DB_PASS
DB_PASS=${DB_PASS:-$DEFAULT_DB_PASS}

# 3. SuperAdmin Username
read -p "Enter SuperAdmin Username [default: admin]: " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-admin}

# 4. SuperAdmin Password
DEFAULT_ADMIN_PASS="Admin@$(openssl rand -hex 4)"
read -p "Enter SuperAdmin Password [default: $DEFAULT_ADMIN_PASS]: " ADMIN_PASS
ADMIN_PASS=${ADMIN_PASS:-$DEFAULT_ADMIN_PASS}

# 5. GapGPT API Key
read -p "Enter GapGPT / OpenAI API Key [Press Enter to use existing key]: " AI_KEY
AI_KEY=${AI_KEY:-"sk-qObNXitygRsmutSXMGJaW6vo8TNeVcVgxpd6QBwDAm5dynJf"}

echo -e "\n${YELLOW}Step 2: Installing System Packages & Dependencies${NC}"
echo "------------------------------------------------------"
apt-get update
apt-get install -y curl git ufw ca-certificates gnupg lsb-release build-essential

# Install Node.js 20 LTS if not present
if ! command -v node &> /dev/null || [[ $(node -v) != v20* && $(node -v) != v22* ]]; then
  echo "Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo -e "${GREEN}Node version: $(node -v)${NC}"

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2 globally..."
  npm install -g pm2
fi

# Install Puppeteer / Chromium system dependencies for PDF generation
echo "Installing Chromium / PDF rendering dependencies..."
apt-get install -y \
  fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 \
  libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 \
  libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
  libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 xdg-utils

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
  echo "Installing PostgreSQL..."
  apt-get install -y postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
  echo "Installing Nginx..."
  apt-get install -y nginx
  systemctl enable nginx
  systemctl start nginx
fi

echo -e "\n${YELLOW}Step 3: Configuring PostgreSQL Database${NC}"
echo "------------------------------------------------------"
# Create user and database if they don't exist
sudo -u postgres psql -c "DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gymscale_user') THEN
    CREATE ROLE gymscale_user WITH LOGIN PASSWORD '$DB_PASS';
  ELSE
    ALTER ROLE gymscale_user WITH PASSWORD '$DB_PASS';
  END IF;
END
\$\$;"

sudo -u postgres psql -c "SELECT 'CREATE DATABASE nutritrain_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nutritrain_db')\gexec"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nutritrain_db TO gymscale_user;"
sudo -u postgres psql -c "ALTER DATABASE nutritrain_db OWNER TO gymscale_user;"
echo -e "${GREEN}PostgreSQL database 'nutritrain_db' and user 'gymscale_user' configured successfully!${NC}"

echo -e "\n${YELLOW}Step 4: Generating .env Configuration${NC}"
echo "------------------------------------------------------"
APP_DIR=$(pwd)
AUTH_SECRET=$(openssl rand -base64 32)

# Determine protocol
if [[ "$DOMAIN_OR_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  BASE_URL="http://${DOMAIN_OR_IP}"
else
  BASE_URL="https://${DOMAIN_OR_IP}"
fi

cat > "$APP_DIR/.env" <<EOF
# PostgreSQL Connection
DATABASE_URL="postgresql://gymscale_user:${DB_PASS}@127.0.0.1:5432/nutritrain_db?schema=public"

# Auth Secrets
AUTH_SECRET="${AUTH_SECRET}"
AUTH_URL="${BASE_URL}"
NEXTAUTH_URL="${BASE_URL}"

# SuperAdmin Initial Credentials
ADMIN_USERNAME="${ADMIN_USER}"
ADMIN_PASSWORD="${ADMIN_PASS}"

# AI Routines & Diets
GAPGPT_API_KEY="${AI_KEY}"
GAPGPT_BASE_URL="https://api.gapgpt.app/v1"

# Environment
NODE_ENV="production"
PORT=3000
EOF

chown $REAL_USER:$REAL_USER "$APP_DIR/.env"
echo -e "${GREEN}.env file successfully generated!${NC}"

echo -e "\n${YELLOW}Step 5: Installing Project Dependencies & Building${NC}"
echo "------------------------------------------------------"
mkdir -p "$APP_DIR/logs"
chown -R $REAL_USER:$REAL_USER "$APP_DIR"

sudo -u $REAL_USER npm install
sudo -u $REAL_USER npx prisma generate
sudo -u $REAL_USER npx prisma db push
sudo -u $REAL_USER npm run seed
sudo -u $REAL_USER npm run build

echo -e "\n${YELLOW}Step 6: Setting up PM2 Service${NC}"
echo "------------------------------------------------------"
sudo -u $REAL_USER pm2 delete gym-scale 2>/dev/null || true
sudo -u $REAL_USER pm2 start ecosystem.config.cjs
sudo -u $REAL_USER pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u $REAL_USER --hp $USER_HOME || true

echo -e "\n${YELLOW}Step 7: Configuring Nginx Reverse Proxy${NC}"
echo "------------------------------------------------------"
cat > /etc/nginx/sites-available/gym-scale <<EOF
upstream gymscale_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_OR_IP};

    client_max_body_size 50M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;

    location /_next/static/ {
        proxy_pass http://gymscale_upstream;
        proxy_cache_bypass \$http_upgrade;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /uploads/ {
        proxy_pass http://gymscale_upstream;
        proxy_cache_bypass \$http_upgrade;
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000";
    }

    location /api/messages/stream {
        proxy_pass http://gymscale_upstream;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        chunked_transfer_encoding off;
    }

    location / {
        proxy_pass http://gymscale_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/gym-scale /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Firewall setup
if command -v ufw &> /dev/null; then
  ufw allow OpenSSH || true
  ufw allow 'Nginx Full' || true
  ufw --force enable || true
fi

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}      🎉 Gym-Scale Successfully Installed & Started!   ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Access your application at: ${BLUE}${BASE_URL}${NC}"
echo -e "Admin Panel URL:            ${BLUE}${BASE_URL}/admin${NC}"
echo -e "Admin Username:             ${YELLOW}${ADMIN_USER}${NC}"
echo -e "Admin Password:             ${YELLOW}${ADMIN_PASS}${NC}"
echo -e "Database User:              ${YELLOW}gymscale_user${NC}"
echo -e "Database Password:          ${YELLOW}${DB_PASS}${NC}"
echo -e "Database Name:              ${YELLOW}nutritrain_db${NC}"
echo -e "Configuration File:         ${YELLOW}${APP_DIR}/.env${NC}"
echo -e "\n${BLUE}To view application logs:${NC} pm2 logs gym-scale"
echo -e "${BLUE}To restart application:${NC}   pm2 restart gym-scale"

if [[ ! "$DOMAIN_OR_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "\n${YELLOW}To enable Free HTTPS/SSL, run:${NC}"
  echo "sudo apt install -y certbot python3-certbot-nginx"
  echo "sudo certbot --nginx -d ${DOMAIN_OR_IP}"
fi
echo -e "======================================================\n"
