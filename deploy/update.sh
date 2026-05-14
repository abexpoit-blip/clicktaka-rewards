#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${APP_DIR:-}"

if [[ -z "$APP_DIR" ]]; then
  if [[ -d "$SCRIPT_APP_DIR/.git" ]]; then
    APP_DIR="$SCRIPT_APP_DIR"
  elif [[ -d "/var/www/clicktaka/.git" ]]; then
    APP_DIR="/var/www/clicktaka"
  elif [[ -d "/var/www/clicktaka-rewards/.git" ]]; then
    APP_DIR="/var/www/clicktaka-rewards"
  elif [[ -d "/var/www/clicktaka" ]]; then
    APP_DIR="/var/www/clicktaka"
  elif [[ -d "/var/www/clicktaka-rewards" ]]; then
    APP_DIR="/var/www/clicktaka-rewards"
  else
    echo "ERROR: App directory not found. Expected /var/www/clicktaka or /var/www/clicktaka-rewards." >&2
    exit 1
  fi
fi

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

echo "==> Building frontend (clean)"
rm -rf dist
npm run build
if [[ ! -f "dist/server/index.js" ]]; then
  echo "ERROR: Build failed — dist/server/index.js missing. Aborting deploy." >&2
  exit 1
fi
echo "  ✓ Build complete: $(ls -la dist/server/index.js | awk '{print $5, $6, $7, $8}')"

echo "==> Installing backend dependencies"
npm install --prefix server --no-audit --no-fund

echo "==> Ensuring backend environment"
mkdir -p server
touch server/.env

get_env_value() {
  local key="$1"
  grep -E "^[[:space:]]*${key}=" server/.env | tail -n 1 | cut -d= -f2- | sed -e 's/^\"//' -e 's/\"$//' -e "s/^'//" -e "s/'$//"
}

set_env_value() {
  local key="$1"
  local value="$2"
  if grep -qE "^[[:space:]]*${key}=" server/.env; then
    python3 - "$key" "$value" <<'PY'
from pathlib import Path
import sys
key, value = sys.argv[1], sys.argv[2]
path = Path('server/.env')
lines = path.read_text().splitlines()
written = False
for i, line in enumerate(lines):
    if line.strip().startswith(f'{key}='):
        lines[i] = f'{key}={value}'
        written = True
if not written:
    lines.append(f'{key}={value}')
path.write_text('\n'.join(lines) + '\n')
PY
  else
    printf '%s=%s\n' "$key" "$value" >> server/.env
  fi
}

ensure_env_value() {
  local key="$1"
  local default_value="$2"
  local current
  current="$(get_env_value "$key" || true)"
  if [[ -z "$current" ]]; then
    set_env_value "$key" "$default_value"
  fi
}

ensure_env_value DB_HOST "localhost"
ensure_env_value DB_PORT "3306"
ensure_env_value DB_USER "clicktaka"
ensure_env_value DB_NAME "clicktaka"
ensure_env_value PORT "3001"
ensure_env_value NODE_ENV "production"
ensure_env_value FRONTEND_URL "https://clicktaka24.com"
ensure_env_value COOKIE_DOMAIN ".clicktaka24.com"
ensure_env_value ADMIN_USERNAME "admin"
ensure_env_value ADMIN_PHONE "01700000000"

ADMIN_PASSWORD_CURRENT="$(get_env_value ADMIN_PASSWORD || true)"
if [[ -z "$ADMIN_PASSWORD_CURRENT" ]]; then
  if [[ -n "${ADMIN_PASSWORD:-}" ]]; then
    set_env_value ADMIN_PASSWORD "$ADMIN_PASSWORD"
  else
    set_env_value ADMIN_PASSWORD "Admin@1234"
  fi
fi

DB_PASS_CURRENT="$(get_env_value DB_PASS || true)"
DB_PASSWORD_CURRENT="$(get_env_value DB_PASSWORD || true)"
if [[ -z "$DB_PASS_CURRENT" ]]; then
  if [[ -n "${MYSQL_PASSWORD:-}" ]]; then
    set_env_value DB_PASS "$MYSQL_PASSWORD"
  elif [[ -n "${MYSQL_PWD:-}" ]]; then
    set_env_value DB_PASS "$MYSQL_PWD"
  elif [[ -n "$DB_PASSWORD_CURRENT" ]]; then
    set_env_value DB_PASS "$DB_PASSWORD_CURRENT"
  elif [[ -t 0 ]]; then
    read -rsp "Enter MySQL password for clicktaka user: " DB_PASS_INPUT
    echo
    set_env_value DB_PASS "$DB_PASS_INPUT"
  else
    echo "ERROR: DB_PASS is missing in server/.env. Run: MYSQL_PASSWORD='your_mysql_password' bash deploy/update.sh" >&2
    exit 1
  fi
fi

JWT_CURRENT="$(get_env_value JWT_SECRET || true)"
if [[ -z "$JWT_CURRENT" || "$JWT_CURRENT" == "dev-secret-change-me" || "$JWT_CURRENT" == "change_this_to_a_long_random_secret_64_chars_minimum" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    set_env_value JWT_SECRET "$(openssl rand -hex 32)"
  else
    set_env_value JWT_SECRET "$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  fi
fi

echo "==> Applying database migrations (using server/.env credentials)"
if [[ -f "server/.env" && -f "database/schema.sql" ]]; then
  set -a
  # shellcheck disable=SC1091
  source server/.env
  set +a
  MYSQL_PWD="${DB_PASS:-${DB_PASSWORD:-}}" mysql \
    -h "${DB_HOST:-localhost}" \
    -P "${DB_PORT:-3306}" \
    -u "${DB_USER:-clicktaka}" \
    "${DB_NAME:-clicktaka}" < database/schema.sql
else
  echo "  skipped: server/.env or schema file missing"
fi

if [[ -f "server/.env" && -f "database/migrations/2026_05_payments.sql" ]]; then
  set -a
  # shellcheck disable=SC1091
  source server/.env
  set +a
  MYSQL_PWD="${DB_PASS:-${DB_PASSWORD:-}}" mysql \
    -h "${DB_HOST:-localhost}" \
    -P "${DB_PORT:-3306}" \
    -u "${DB_USER:-clicktaka}" \
    "${DB_NAME:-clicktaka}" < database/migrations/2026_05_payments.sql
else
  echo "  skipped: server/.env or migration file missing"
fi

echo "==> Ensuring admin user"
node server/scripts/ensure-admin.mjs

echo "==> Restarting PM2 processes (delete+start to apply env changes)"
pm2 flush clicktaka-api clicktaka-web >/dev/null 2>&1 || true
pm2 delete clicktaka-api clicktaka-web 2>/dev/null || true

echo "==> Freeing ports 3001/3002/4000 if held by orphan processes"
for P in 3001 3002 4000; do
  PIDS="$(ss -ltnp 2>/dev/null | awk -v p=":$P" '$4 ~ p {print $0}' | grep -oP 'pid=\K[0-9]+' | sort -u || true)"
  if [[ -n "${PIDS:-}" ]]; then
    echo "  killing PIDs on :$P -> $PIDS"
    kill -9 $PIDS 2>/dev/null || true
  fi
done

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

echo "==> Port bindings"
ss -ltnp 2>/dev/null | grep -E ':3001|:3002|:4000' || echo "  (no listeners on 3001/3002/4000)"

echo "==> Recent logs"
pm2 logs clicktaka-api clicktaka-web --lines 40 --nostream
