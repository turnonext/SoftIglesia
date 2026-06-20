# Levantar LMS SaaS completo (requiere Docker Hub accesible)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

# Comprobar DNS Docker Hub
try {
    $null = Resolve-DnsName registry-1.docker.io -ErrorAction Stop
} catch {
    Write-Host "ERROR: No se resuelve registry-1.docker.io (DNS/red)." -ForegroundColor Red
    Write-Host "Usa en su lugar: .\scripts\levantar-xampp.ps1" -ForegroundColor Yellow
    Write-Host "Mas info: docs\DOCKER-DNS.md"
    exit 1
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Creado .env desde .env.example"
}

if (-not (Test-Path "backend/.env")) {
    Copy-Item "backend/.env.example" "backend/.env"
}

Write-Host "Construyendo contenedores..."
docker compose build backend

Write-Host "Iniciando stack..."
docker compose up -d mysql redis

Start-Sleep -Seconds 15

docker compose up -d backend nginx

Write-Host "Generando APP_KEY y JWT..."
docker compose exec -T backend php artisan key:generate --force
docker compose exec -T backend php artisan jwt:secret --force 2>$null
if ($LASTEXITCODE -ne 0) {
    docker compose exec -T backend php -r "file_put_contents('.env', preg_replace('/JWT_SECRET=.*/', 'JWT_SECRET='.bin2hex(random_bytes(32)), file_get_contents('.env')));"
}

Write-Host "Migrando y seed..."
docker compose exec -T backend php artisan migrate --force
docker compose exec -T backend php artisan db:seed --force

docker compose up -d horizon scheduler rabbitmq minio frontend

Write-Host ""
Write-Host "=== LMS SaaS listo ===" -ForegroundColor Green
Write-Host "API:      http://localhost:8080/api/health"
Write-Host "Frontend: http://localhost:3000"
Write-Host "Login:    admin@demo.com / Password123! (tenant: demo)"
Write-Host "RabbitMQ: http://localhost:15672 (lms / secret)"
Write-Host "MinIO:    http://localhost:9001 (minio / minio12345)"
