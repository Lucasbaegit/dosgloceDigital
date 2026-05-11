param(
  [string]$ProjectRoot = "C:\Users\baezl\Desktop\proyectos\desgloceExcel\excel_desfloce",
  [int]$ApiPort = 8000,
  [int]$FrontendPort = 5174,
  [switch]$BuildFrontend
)

$ErrorActionPreference = "Stop"

if ($BuildFrontend) {
  powershell -ExecutionPolicy Bypass -File (Join-Path $ProjectRoot "scripts\deploy_local\build_frontend.ps1") -ProjectRoot $ProjectRoot
}

powershell -ExecutionPolicy Bypass -File (Join-Path $ProjectRoot "scripts\deploy_local\start_cotizador_local.ps1") -ProjectRoot $ProjectRoot -ApiPort $ApiPort -FrontendPort $FrontendPort

$max = 20
$ready = $false
for ($i=0; $i -lt $max; $i++) {
  Start-Sleep -Seconds 1
  try {
    $a = Invoke-WebRequest -Uri "http://127.0.0.1:$ApiPort/health" -UseBasicParsing -TimeoutSec 3
    $f = Invoke-WebRequest -Uri "http://127.0.0.1:$FrontendPort" -UseBasicParsing -TimeoutSec 3
    if ($a.StatusCode -eq 200 -and $f.StatusCode -ge 200) { $ready = $true; break }
  } catch {}
}

if (-not $ready) {
  Write-Host "[WARN] API/frontend no respondieron a tiempo. Revisá logs en logs/deploy_local/." -ForegroundColor Yellow
}

Write-Host "[INFO] Levantando Cloudflare Tunnel hacia API+frontend en puerto $ApiPort..."
powershell -ExecutionPolicy Bypass -File (Join-Path $ProjectRoot "scripts\deploy_local\start_cloudflare_tunnel.ps1") -Port $ApiPort
