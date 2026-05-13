#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> Deploying from: $APP_DIR"
git pull

echo "==> Installing frontend dependencies"
npm install

echo "==> Building frontend"
npm run build

echo "==> Installing backend dependencies"
npm install --prefix server

echo "==> Reloading PM2 processes"
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save

echo "==> Health check"
curl -fsS http://127.0.0.1:3001/api/health
echo

echo "==> Recent logs"
pm2 logs clicktaka-api clicktaka-web --lines 40 --nostream