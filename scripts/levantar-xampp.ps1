# LMS SaaS — Levantar con XAMPP + MySQL
# Uso: .\scripts\levantar-xampp.ps1
# Opcional: .\scripts\levantar-xampp.ps1 -DbPassword "tu_clave_root"

param(
    [string]$DbHost = "127.0.0.1",
    [int]$DbPort = 3306,
    [string]$DbName = "lms_saas",
    [string]$DbUser = "root",
    [string]$DbPassword = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Php = "C:\xampp\php\php.exe"
$Mysql = "C:\xampp\mysql\bin\mysql.exe"
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

if (-not (Test-Path $Php)) {
    Write-Host "ERROR: No se encuentra XAMPP en C:\xampp\php\php.exe" -ForegroundColor Red
    exit 1
}

Write-Host "=== LMS SaaS (XAMPP + MySQL) ===" -ForegroundColor Cyan

# Compatibilidad PHP 8.2 (XAMPP)
$platformCheck = Join-Path $Backend "vendor\composer\platform_check.php"
if (Test-Path $platformCheck) {
    (Get-Content $platformCheck -Raw) -replace '80400', '80200' -replace '8\.4\.0', '8.2.0' | Set-Content $platformCheck -NoNewline
}

Set-Location $Backend

# .env con MySQL
$envXampp = Join-Path $Backend ".env.xampp"
$envFile = Join-Path $Backend ".env"
$oldKey = $null
$oldJwt = $null
if (Test-Path $envFile) {
    $old = Get-Content $envFile -Raw
    if ($old -match 'APP_KEY=(base64:[^\r\n]+)') { $oldKey = $Matches[1] }
    if ($old -match 'JWT_SECRET=([^\r\n]+)') { $oldJwt = $Matches[1] }
}
Copy-Item $envXampp $envFile -Force
if ($oldKey) { (Get-Content $envFile) -replace 'APP_KEY=.*', "APP_KEY=$oldKey" | Set-Content $envFile }
if ($oldJwt -and $oldJwt.Length -ge 16) {
    (Get-Content $envFile) -replace 'JWT_SECRET=.*', "JWT_SECRET=$oldJwt" | Set-Content $envFile
}
if ($DbPassword) {
    (Get-Content $envFile) -replace 'DB_PASSWORD=.*', "DB_PASSWORD=$DbPassword" | Set-Content $envFile
}

# Crear base de datos
if (-not (Test-Path $Mysql)) {
    Write-Host "ERROR: No se encuentra $Mysql" -ForegroundColor Red
    Write-Host "Abre XAMPP Control Panel e inicia MySQL." -ForegroundColor Yellow
    exit 1
}

$sqlFile = Join-Path $Root "scripts\crear-db-mysql.sql"
$mysqlArgs = @("-h", $DbHost, "-P", $DbPort, "-u", $DbUser)
if ($DbPassword) { $mysqlArgs += "-p$DbPassword" } else { $mysqlArgs += "--password=" }

Write-Host "Creando base de datos '$DbName' si no existe..."
& $Mysql @mysqlArgs -e "CREATE DATABASE IF NOT EXISTS ``$DbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudo conectar a MySQL." -ForegroundColor Red
    Write-Host "1) Abre XAMPP -> Start MySQL" -ForegroundColor Yellow
    Write-Host "2) Si root tiene clave: .\scripts\levantar-xampp.ps1 -DbPassword 'tu_clave'" -ForegroundColor Yellow
    exit 1
}

$envContent = Get-Content $envFile -Raw
if ($envContent -notmatch 'APP_KEY=base64:[A-Za-z0-9+/=]{20,}') {
    & $Php artisan key:generate --force
    $envContent = Get-Content $envFile -Raw
}
if ($envContent -notmatch 'JWT_SECRET=\S{16,}') {
    $jwt = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
    (Get-Content $envFile) -replace 'JWT_SECRET=.*', "JWT_SECRET=$jwt" | Set-Content $envFile
    Write-Host "JWT_SECRET generado"
}

& $Php artisan config:clear
Write-Host "Migrando MySQL (migrate:fresh --seed)..."
& $Php artisan migrate:fresh --seed --force

Write-Host ""
Write-Host "Backend: http://127.0.0.1:8000" -ForegroundColor Green
Start-Process -FilePath $Php -ArgumentList "artisan", "serve", "--host=127.0.0.1", "--port=8000" -WorkingDirectory $Backend -WindowStyle Normal

Set-Location $Root
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    foreach ($p in @("C:\Program Files\nodejs\npm.cmd")) {
        if (Test-Path $p) { $npm = @{ Source = $p }; break }
    }
}

"NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api" | Set-Content (Join-Path $Frontend ".env.local") -Encoding utf8

if ($npm) {
    Set-Location $Frontend
    if (-not (Test-Path "node_modules")) { & $npm.Source install }
    Start-Process -FilePath $npm.Source -ArgumentList "run", "dev" -WorkingDirectory $Frontend -WindowStyle Normal
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "Frontend: instala Node y ejecuta 'cd frontend; npm install; npm run dev'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "MySQL: $DbName @ ${DbHost}:$DbPort (usuario: $DbUser)" -ForegroundColor Cyan
Write-Host "Login: tenant demo | admin@demo.com | Password123!" -ForegroundColor Cyan
