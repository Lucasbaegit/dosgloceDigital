param(
  [int]$ApiPort = 8000,
  [int]$FrontendPort = 5174,
  [int]$TimeoutSec = 8
)

$ErrorActionPreference = "Stop"
$ApiBase = "http://127.0.0.1:$ApiPort"
$FrontendBase = "http://127.0.0.1:$FrontendPort"
$failures = New-Object System.Collections.Generic.List[string]

function Check-Url([string]$Label, [string]$Url, [int]$TimeoutSec) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
      Write-Host "[PASS] $Label OK ($($response.StatusCode))" -ForegroundColor Green
      return $true
    }
    Write-Host "[FAIL] $Label respondió $($response.StatusCode)" -ForegroundColor Red
    return $false
  } catch {
    Write-Host "[FAIL] $Label :: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

if (-not (Check-Url "Backend /health" "$ApiBase/health" $TimeoutSec)) { $failures.Add("Backend") }
if (-not (Check-Url "Frontend" $FrontendBase $TimeoutSec)) { $failures.Add("Frontend") }
if (-not (Check-Url "Admin precios" "$ApiBase/admin-precios/variables-editables" $TimeoutSec)) { $failures.Add("Admin precios") }
if (-not (Check-Url "Trazabilidad" "$ApiBase/trazabilidad/grafo?caso=click_bajadas" $TimeoutSec)) { $failures.Add("Trazabilidad") }
if (-not (Check-Url "Export Excel" "$ApiBase/export/precios/excel" $TimeoutSec)) { $failures.Add("Export Excel") }

Write-Host ""
if ($failures.Count -eq 0) {
  Write-Host "Sistema listo" -ForegroundColor Green
  Write-Host "Backend OK"
  Write-Host "Frontend OK"
  Write-Host "Admin precios OK"
  Write-Host "Trazabilidad OK"
  Write-Host "Export Excel OK"
  exit 0
}

Write-Host "Sistema con fallas: $($failures -join ', ')" -ForegroundColor Red
Write-Host "Si la API no responde, levantá scripts/deploy_local/start_cotizador_local.ps1 o scripts/local/iniciar_cotizador_local.ps1 -Restart"
exit 1
