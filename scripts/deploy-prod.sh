#!/usr/bin/env bash
# Deploy en VPS (invocado por GitHub Actions tras merge a main).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BACKEND_DIR="${BACKEND_DIR:-backend}"
FRONTEND_DIR="${FRONTEND_DIR:-frontend}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"
PHP_FPM_SERVICE="${PHP_FPM_SERVICE:-}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-}"

echo "==> Backend ($BACKEND_DIR)"
cd "$ROOT/$BACKEND_DIR"

if [[ ! -f .env ]]; then
  echo "ERROR: falta $BACKEND_DIR/.env en el VPS." >&2
  exit 1
fi

composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader

if [[ "$RUN_MIGRATIONS" == "true" ]]; then
  echo "==> Migraciones"
  php artisan migrate --force
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache || true
php artisan event:cache || true

echo "==> Frontend ($FRONTEND_DIR)"
cd "$ROOT/$FRONTEND_DIR"
npm ci
npm run build

if [[ -n "$PHP_FPM_SERVICE" ]]; then
  echo "==> Restart $PHP_FPM_SERVICE"
  sudo systemctl restart "$PHP_FPM_SERVICE"
fi

if [[ -n "$FRONTEND_SERVICE" ]]; then
  echo "==> Restart $FRONTEND_SERVICE"
  sudo systemctl restart "$FRONTEND_SERVICE"
fi

echo "==> Deploy OK"
