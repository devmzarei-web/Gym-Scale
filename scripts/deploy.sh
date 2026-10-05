#!/usr/bin/env bash
# ==============================================================================
# Gym-Scale Production Deployment & Update Script
# Run this script whenever you push new changes to main.
# Usage: ./scripts/deploy.sh
# ==============================================================================

set -e

echo "=========================================="
echo "🚀 Starting Gym-Scale Deployment..."
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure your database and secrets."
    exit 1
fi

# Ensure logs directory exists
mkdir -p logs

echo "📥 1. Pulling latest commits from GitHub..."
git pull origin main

echo "📦 2. Installing dependencies..."
npm install --production=false

echo "🔄 3. Synchronizing Prisma database schema..."
npx prisma generate
npx prisma db push

echo "🏗️ 4. Building Next.js application..."
npm run build

echo "♻️ 5. Reloading PM2 service..."
if pm2 list | grep -q "gym-scale"; then
    pm2 reload ecosystem.config.cjs --update-env
    echo "✅ PM2 process reloaded."
else
    pm2 start ecosystem.config.cjs
    pm2 save
    echo "✅ PM2 process started and saved."
fi

echo "=========================================="
echo "🎉 Deployment successfully finished!"
echo "=========================================="
