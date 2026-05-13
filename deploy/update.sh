#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> Deploying from: $APP_DIR"

echo "==> Resetting auto-generated files & pulling latest"
git checkout -- src/routeTree.gen.ts 2>/dev/null || true
git stash push -u -m "auto-stash-$(date +%s)" -- src/routeTree.gen.ts 2>/dev/null || true
git fetch origin main
git reset --hard origin/main

echo "==> Updating PM2 runtime (fixes _getActiveHandles errors)"
npm install -g pm2@latest >/dev/null 2>&1 || true
pm2 update >/dev/null 2>&1 || true

echo "==> Installing frontend dependencies"
npm install --no-audit --no-fund

echo "==> Building frontend"
npm run build

echo "==> Installing backend dependencies"
npm install --prefix server --no-audit --no-fund

echo "==> Restarting PM2 processes (delete+start to apply env changes)"
pm2 delete clicktaka-api clicktaka-web 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs --update-env
pm2 save

echo "==> Waiting for API to come up..."
for i in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:3001/api/health >/dev/null 2>&1; then
    echo "  ✓ API healthy on :3001"
    break
  fi
  sleep 1
done

echo "==> Health check"
curl -sS http://127.0.0.1:3001/api/health || echo "  ✗ API NOT responding on :3001"
echo
echo "==> Web check"
curl -sS -o /dev/null -w "  web :3002 -> HTTP %{http_code}\n" http://127.0.0.1:3002/ || true

echo "==> Recent logs"
pm2 logs clicktaka-api clicktaka-web --lines 30 --nostream
