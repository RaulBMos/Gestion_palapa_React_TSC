# Script para iniciar tanto el servidor backend como el frontend en Windows
# Uso: .\dev.ps1

Write-Host "🚀 Iniciando CasaGestión (Frontend + Backend)..." -ForegroundColor Green
Write-Host ""

# Verificar que existe la carpeta server
if (-not (Test-Path "server")) {
  Write-Host "❌ Carpeta 'server' no encontrada" -ForegroundColor Red
  exit 1
}

# Verificar que existe node_modules en server
if (-not (Test-Path "server\node_modules")) {
  Write-Host "⚠️  Instalando dependencias del servidor..." -ForegroundColor Yellow
  Push-Location server
  npm install
  Pop-Location
}

# Iniciar el servidor backend en nueva ventana
Write-Host "📦 Iniciando servidor backend en puerto 3001..." -ForegroundColor Cyan
$serverScript = @"
  Push-Location "$PSScriptRoot\server"
  npm run dev
  Pop-Location
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $serverScript -WindowStyle Normal

# Esperar un segundo para que el servidor se inicie
Start-Sleep -Seconds 2

# Iniciar el frontend Vite
Write-Host "⚛️  Iniciando frontend Vite en puerto 5173..." -ForegroundColor Cyan
npm run dev

Write-Host "✅ Aplicación cerrada" -ForegroundColor Green
