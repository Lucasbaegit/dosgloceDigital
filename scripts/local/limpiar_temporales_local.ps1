$ErrorActionPreference = "Stop"

function Get-ProjectRoot {
  $scriptDir = Split-Path -Parent $PSCommandPath
  return (Resolve-Path (Join-Path $scriptDir "..\..")).Path
}

$ProjectRoot = Get-ProjectRoot
Set-Location $ProjectRoot

$paths = @(
  "logs\deploy_local\api.log",
  "logs\deploy_local\frontend.log",
  "logs\deploy_local\cotizador_local_pids.json",
  "frontend\test-results",
  "reports\qa",
  "reports\exports",
  "frontend\debug.log",
  "debug.log"
)

foreach ($path in $paths) {
  $full = Join-Path $ProjectRoot $path
  if (Test-Path $full) {
    Remove-Item -LiteralPath $full -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Limpiado: $path"
  }
}

Get-ChildItem -Path $ProjectRoot -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*.pyc" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "[OK] Limpieza temporal segura completada." -ForegroundColor Green
Write-Host "[INFO] No se borraron data/, configs, historial ni backups reales."
