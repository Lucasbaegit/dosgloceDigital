param(
  [int]$ApiPort = 8000,
  [int]$FrontendPort = 5174,
  [switch]$Clean,
  [switch]$Restart,
  [switch]$NoBrowser,
  [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"

function Get-ProjectRoot {
  $scriptDir = Split-Path -Parent $PSCommandPath
  return (Resolve-Path (Join-Path $scriptDir "..\..")).Path
}

function Test-HttpOk([string]$Url, [int]$TimeoutSec = 3) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
  } catch {
    return $false
  }
}

function Wait-Url([string]$Name, [string]$Url, [int]$Seconds = 40) {
  for ($i = 1; $i -le $Seconds; $i++) {
    if (Test-HttpOk $Url 2) {
      Write-Host "[OK] $Name listo: $Url" -ForegroundColor Green
      return $true
    }
    Start-Sleep -Seconds 1
  }
  Write-Host "[FAIL] $Name no respondió a tiempo: $Url" -ForegroundColor Red
  return $false
}

function Assert-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "No se encontró '$Name' en PATH."
  }
}

$ProjectRoot = Get-ProjectRoot
$logsDir = Join-Path $ProjectRoot "logs\deploy_local"
$pidFile = Join-Path $logsDir "cotizador_local_pids.json"
$frontendDir = Join-Path $ProjectRoot "frontend"
$apiUrl = "http://127.0.0.1:$ApiPort"
$frontendUrl = "http://127.0.0.1:$FrontendPort"

New-Item -ItemType Directory -Force $logsDir | Out-Null

if ($Clean) {
  powershell -ExecutionPolicy Bypass -File (Join-Path $ProjectRoot "scripts\local\limpiar_temporales_local.ps1")
}

if ($Restart) {
  powershell -ExecutionPolicy Bypass -File (Join-Path $ProjectRoot "scripts\local\apagar_cotizador_local.ps1") -ApiPort $ApiPort -FrontendPort $FrontendPort
}

Assert-Command python
Assert-Command node
Assert-Command npm

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
  Write-Host "[WARN] No existe frontend\node_modules. Ejecutá: cd frontend; npm install" -ForegroundColor Yellow
}

$apiReady = Test-HttpOk "$apiUrl/health" 2
$frontendReady = Test-HttpOk $frontendUrl 2

$started = @{}

if ($apiReady) {
  Write-Host "[OK] Backend ya está respondiendo en $apiUrl" -ForegroundColor Green
} else {
  $apiLog = Join-Path $logsDir "api.log"
  $apiCmd = "cd /d `"$ProjectRoot`" && python scripts\bajadas_v2\run_api_bajadas_v2.py --host 127.0.0.1 --port $ApiPort > `"$apiLog`" 2>&1"
  $apiProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $apiCmd -WindowStyle Hidden -PassThru
  $started.api_pid = $apiProc.Id
  $started.api_log = $apiLog
  Write-Host "[OK] Backend iniciado PID=$($apiProc.Id) log=$apiLog" -ForegroundColor Green
}

if ($frontendReady) {
  Write-Host "[OK] Frontend ya está respondiendo en $frontendUrl" -ForegroundColor Green
} else {
  $frontLog = Join-Path $logsDir "frontend.log"
  $frontCmd = "cd /d `"$frontendDir`" && npm run dev -- --host 127.0.0.1 --port $FrontendPort --strictPort > `"$frontLog`" 2>&1"
  $frontProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $frontCmd -WindowStyle Hidden -PassThru
  $started.frontend_pid = $frontProc.Id
  $started.frontend_log = $frontLog
  Write-Host "[OK] Frontend iniciado PID=$($frontProc.Id) log=$frontLog" -ForegroundColor Green
}

if ($started.Keys.Count -gt 0) {
  $started.project_root = $ProjectRoot
  $started.api_port = $ApiPort
  $started.frontend_port = $FrontendPort
  $started.started_at = (Get-Date).ToString("s")
  $started | ConvertTo-Json | Set-Content -Path $pidFile -Encoding UTF8
}

$backendOk = Wait-Url "Backend" "$apiUrl/health" 45
$frontendOk = Wait-Url "Frontend" $frontendUrl 45

Write-Host ""
Write-Host "URLs locales:" -ForegroundColor Cyan
Write-Host " - Backend:  $apiUrl"
Write-Host " - Frontend: $frontendUrl"
Write-Host ""
Write-Host "Abrí el sistema en $frontendUrl" -ForegroundColor Cyan
Write-Host "Para apagar: powershell -ExecutionPolicy Bypass -File .\scripts\local\apagar_cotizador_local.ps1"
Write-Host "Para verificar: powershell -ExecutionPolicy Bypass -File .\scripts\local\verificar_cotizador_local.ps1"

if ($OpenBrowser -or (-not $NoBrowser)) {
  if ($frontendOk) {
    Start-Process $frontendUrl
  }
}

if (-not ($backendOk -and $frontendOk)) {
  Write-Host "Revisá logs en $logsDir" -ForegroundColor Yellow
  exit 1
}

exit 0



