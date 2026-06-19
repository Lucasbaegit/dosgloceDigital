param(
  [string]$BackupRoot = "backups\local"
)

$ErrorActionPreference = "Stop"

function Get-ProjectRoot {
  $scriptDir = Split-Path -Parent $PSCommandPath
  return (Resolve-Path (Join-Path $scriptDir "..\..")).Path
}

function Copy-IfExists([string]$Source, [string]$Destination) {
  if (-not (Test-Path $Source)) { return }
  New-Item -ItemType Directory -Force (Split-Path -Parent $Destination) | Out-Null
  Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
}

$ProjectRoot = Get-ProjectRoot
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $ProjectRoot (Join-Path $BackupRoot "manual_$timestamp")
New-Item -ItemType Directory -Force $backupDir | Out-Null

Write-Host "[INFO] Creando backup manual en $backupDir"

$items = @("data", "docs", "src", "scripts", "frontend\src", "frontend\package.json", "frontend\package-lock.json", "verificar_bajadas_v2.ps1")
foreach ($item in $items) {
  $source = Join-Path $ProjectRoot $item
  if (Test-Path $source) {
    $dest = Join-Path $backupDir $item
    Copy-IfExists $source $dest
  }
}

$excluded = @(
  "node_modules",
  "frontend\dist",
  "logs",
  "reports",
  "__pycache__",
  "*.pyc"
)

Get-ChildItem -Path $backupDir -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $backupDir -Recurse -Filter "*.pyc" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $backupDir -Recurse -Directory -Filter "dist" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like "*\frontend\dist" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

$manifest = [ordered]@{
  created_at = (Get-Date).ToString("s")
  project_root = $ProjectRoot
  backup_dir = $backupDir
  includes = $items
  excludes = $excluded
  note = "Backup manual local. No commitear backups generados."
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -Path (Join-Path $backupDir "MANIFEST.json") -Encoding UTF8

Write-Host "[OK] Backup manual creado: $backupDir" -ForegroundColor Green
Write-Host "[INFO] No incluye node_modules, frontend/dist, logs, reports, __pycache__ ni *.pyc."
