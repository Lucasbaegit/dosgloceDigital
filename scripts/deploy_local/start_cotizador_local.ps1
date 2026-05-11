param(
  [string]$ProjectRoot = "C:\Users\baezl\Desktop\proyectos\desgloceExcel\excel_desfloce",
  [int]$ApiPort = 8000,
  [int]$FrontendPort = 5174
)

$ErrorActionPreference = "Stop"
$logsDir = Join-Path $ProjectRoot "logs\deploy_local"
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

function Assert-Cmd($cmd) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "No se encontró '$cmd' en PATH."
  }
}

Assert-Cmd python
Assert-Cmd node
Assert-Cmd npm

$frontendDir = Join-Path $ProjectRoot "frontend"
if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
  Write-Host "[WARN] No existe frontend/node_modules. Ejecutá: cd frontend; npm install" -ForegroundColor Yellow
}

$apiLog = Join-Path $logsDir "api.log"
$frontLog = Join-Path $logsDir "frontend.log"

$apiCmd = "Set-Location '$ProjectRoot'; python scripts\bajadas_v2\run_api_bajadas_v2.py --host 127.0.0.1 --port $ApiPort"
$frontCmd = "Set-Location '$frontendDir'; npm run dev -- --host 127.0.0.1 --port $FrontendPort --strictPort"

$apiProc = Start-Process -FilePath "powershell" -ArgumentList "-NoProfile","-Command","$apiCmd *> '$apiLog'" -WindowStyle Hidden -PassThru
$frontProc = Start-Process -FilePath "powershell" -ArgumentList "-NoProfile","-Command","$frontCmd *> '$frontLog'" -WindowStyle Hidden -PassThru

Write-Host "[OK] API iniciada PID=$($apiProc.Id) log=$apiLog"
Write-Host "[OK] Frontend iniciado PID=$($frontProc.Id) log=$frontLog"
Write-Host "URLs locales:"
Write-Host " - http://127.0.0.1:$ApiPort/health"
Write-Host " - http://127.0.0.1:$FrontendPort"
Write-Host "Este script no cierra procesos automáticamente."
