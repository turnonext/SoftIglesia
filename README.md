# LMS SaaS

Monolito modular Laravel 12 + Next.js 15, orquestado con Docker Compose.

## Requisitos

- Docker y Docker Compose
- WSL2 (recomendado en Windows)

Si tienes **XAMPP** o MySQL local, en `.env` usa `MYSQL_PORT=3307` (el contenedor sigue escuchando en 3306 por dentro; solo cambia el puerto en tu máquina).

## Arranque rápido

```bash
cd ~/cursos
chmod +x scripts/setup.sh
./scripts/setup.sh
```

(`make` es opcional: `sudo apt install make` y luego `make setup`.)

Paso a paso sin Make:

```bash
docker compose build
docker compose up -d
docker compose run --rm --user root --entrypoint php backend artisan migrate --force
docker compose run --rm --user root --entrypoint php backend artisan db:seed --force
```

## URLs

| Servicio   | URL |
|-----------|-----|
| API (nginx) | http://localhost:8080 |
| Frontend    | http://localhost:3000 |
| RabbitMQ UI | http://localhost:15672 (`lms` / `secret`) |
| MinIO UI    | http://localhost:9001 (`minio` / `minio12345`) |

## Usuarios demo

Contraseña: `Password123!`

- `admin@demo.com`
- `instructor@demo.com`
- `student@demo.com`

## Comandos útiles

```bash
docker compose ps
docker compose logs -f
docker compose down
docker compose run --rm --user root --entrypoint php backend artisan <comando>
```

Con Make instalado: `make ps`, `make logs`, `make down`, etc.

## Estructura

- `backend/` — API Laravel (módulos en `app/Modules/`)
- `frontend/` — Next.js
- `infra/nginx/` — proxy PHP-FPM
- `scripts/setup.sh` — configuración inicial
