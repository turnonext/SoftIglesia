#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose)
ARTISAN=("${COMPOSE[@]}" run --rm --user root --entrypoint php backend artisan)

if [[ ! -f backend/.env ]]; then
  cp backend/.env.example backend/.env
  echo "Creado backend/.env desde .env.example"
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Creado .env desde .env.example"
fi

echo "==> Construyendo imágenes (si hace falta)..."
"${COMPOSE[@]}" build backend

echo "==> Levantando infraestructura..."
"${COMPOSE[@]}" up -d mysql redis rabbitmq minio
echo "    Esperando MySQL..."
for i in $(seq 1 30); do
  if "${COMPOSE[@]}" exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
    break
  fi
  sleep 2
  if [[ "$i" -eq 30 ]]; then
    echo "MySQL no respondió a tiempo." >&2
    exit 1
  fi
done

echo "==> Levantando aplicación..."
"${COMPOSE[@]}" up -d backend nginx horizon scheduler frontend

echo "==> Dependencias PHP en el volumen (si faltan)..."
"${COMPOSE[@]}" run --rm --user root --entrypoint composer backend \
  install --prefer-dist --no-interaction

echo "==> Claves de aplicación..."
if ! grep -q '^APP_KEY=base64:' backend/.env 2>/dev/null; then
  "${ARTISAN[@]}" key:generate --force
fi
if ! grep -qE '^JWT_SECRET=.+' backend/.env; then
  "${ARTISAN[@]}" jwt:secret --force
fi

echo "==> Migraciones y datos demo..."
"${ARTISAN[@]}" migrate --force
"${ARTISAN[@]}" db:seed --force

echo "==> Permisos storage/cache..."
"${COMPOSE[@]}" run --rm --user root --entrypoint chown backend \
  -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache

"${COMPOSE[@]}" restart backend horizon scheduler nginx

echo ""
echo "Listo."
echo "  API:        http://localhost:${NGINX_HTTP_PORT:-8080}"
echo "  Frontend:   http://localhost:${FRONTEND_PORT:-3000}"
echo "  RabbitMQ:   http://localhost:${RABBITMQ_MGMT_PORT:-15672}  (lms / secret)"
echo "  MinIO:      http://localhost:${MINIO_CONSOLE_PORT:-9001}  (minio / minio12345)"
echo ""
echo "Usuarios demo (contraseña: Password123!):"
echo "  admin@demo.com | instructor@demo.com | student@demo.com"
