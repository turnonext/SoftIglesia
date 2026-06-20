# Instalar y arrancar frontend Next.js
$ErrorActionPreference = "Stop"
$Frontend = Join-Path (Split-Path $PSScriptRoot -Parent) "frontend"

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    if (Test-Path "C:\Program Files\nodejs\npm.cmd") {
        $npm = @{ Source = "C:\Program Files\nodejs\npm.cmd" }
    }
}

if ($npm) {
    Set-Location $Frontend
    Write-Host "npm install..." -ForegroundColor Cyan
    & $npm.Source install
    Write-Host "Listo. Ejecuta: npm run dev" -ForegroundColor Green
    exit 0
}

Write-Host "Node no esta en PATH. Usando Docker..." -ForegroundColor Yellow
docker run --rm -v "${Frontend}:/app" -w /app node:22-alpine sh -c "npm install"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Instala Node.js desde https://nodejs.org/ o arregla Docker DNS." -ForegroundColor Red
    exit 1
}
Write-Host "Dependencias instaladas en frontend/node_modules" -ForegroundColor Green
