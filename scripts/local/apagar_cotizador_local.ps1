param(
  [int]$ApiPort = 8000,
  [int]$FrontendPort = 5174
)

$ErrorActionPreference = "Stop"

function Get-ProjectRoot {
  $scriptDir = Split-Path -Parent $PSCommandPath
  return (Resolve-Path (Join-Path $scriptDir "..\..")).Path
}

function Stop-ProcessSafe([int]$ProcessId, [string]$Reason) {
  if ($ProcessId -le 0) { return }
  $proc = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if ($null -eq $proc) { return }
  Write-Host "[INFO] Deteniendo PID=$ProcessId ($Reason)"
  & taskkill /PID $ProcessId /T /F | Out-Null
}

$ProjectRoot = Get-ProjectRoot
$logsDir = Join-Path $ProjectRoot "logs\deploy_local"
$pidFile = Join-Path $logsDir "cotizador_local_pids.json"
$stopped = 0

if (Test-Path $pidFile) {
  try {
    $pidInfo = Get-Content $pidFile -Raw | ConvertFrom-Json
    if ($pidInfo.api_pid) { Stop-ProcessSafe ([int]$pidInfo.api_pid) "backend registrado"; $stopped++ }
    if ($pidInfo.frontend_pid) { Stop-ProcessSafe ([int]$pidInfo.frontend_pid) "frontend registrado"; $stopped++ }
  } catch {
    Write-Host "[WARN] No se pudo leer ${pidFile}: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

$related = @()
try {
  $escapedRoot = $ProjectRoot.Replace("\", "\\")
  $related = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -and
    ($_.CommandLine -like "*$ProjectRoot*" -or $_.CommandLine -match $escapedRoot) -and
    (
      $_.CommandLine -like "*run_api_bajadas_v2.py*" -or
      $_.CommandLine -like "*vite*--port $FrontendPort*" -or
      $_.CommandLine -like "*npm run dev*--port $FrontendPort*"
    )
  }
} catch {
  Write-Host "[WARN] No se pudieron inspeccionar líneas de comando de procesos. Se usaron solo PIDs registrados." -ForegroundColor Yellow
}

foreach ($proc in $related) {
  Stop-ProcessSafe ([int]$proc.ProcessId) "proceso local del cotizador"
  $stopped++
}

if (Test-Path $pidFile) {
  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

Write-Host "[OK] Apagado local completado. Procesos detenidos/intentos: $stopped" -ForegroundColor Green
Write-Host "[INFO] No se tocaron procesos no relacionados ni cloudflared."




