param(
  [int]$ApiPort = 8000,
  [int]$FrontendPort = 5174,
  [switch]$RunVerifier
)

$ErrorActionPreference = "Stop"

function Check-Url($url) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 8
    Write-Host "[OK] $url ($($r.StatusCode))"
    return $true
  }
  catch {
    Write-Host "[FAIL] $url :: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

$ok = $true
$ok = (Check-Url "http://127.0.0.1:$ApiPort/health") -and $ok
$ok = (Check-Url "http://127.0.0.1:$ApiPort/bajadas-v2/health") -and $ok
$ok = (Check-Url "http://127.0.0.1:$FrontendPort") -and $ok

if ($RunVerifier) {
  Write-Host "[INFO] Ejecutando verificar_bajadas_v2.ps1..."
  powershell -ExecutionPolicy Bypass -File .\verificar_bajadas_v2.ps1 -FrontendUrl "http://127.0.0.1:$FrontendPort"
}

if (-not $ok) { exit 1 }
Write-Host "[OK] Salud local verificada."
