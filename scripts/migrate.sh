#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
docker compose exec -T backend php artisan migrate --force
echo "Migraciones aplicadas."
