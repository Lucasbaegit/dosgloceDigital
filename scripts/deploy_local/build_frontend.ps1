param(
  [string]$ProjectRoot = "C:\Users\baezl\Desktop\proyectos\desgloceExcel\excel_desfloce"
)

$ErrorActionPreference = "Stop"
$frontend = Join-Path $ProjectRoot "frontend"
if (-not (Test-Path $frontend)) { throw "No existe frontend/: $frontend" }

Push-Location $frontend
try {
  if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "[INFO] node_modules no existe. Ejecutando npm install..."
    npm install
  }
  Write-Host "[INFO] Ejecutando npm run build..."
  npm run build
  Write-Host "[OK] Build generado en frontend/dist"
}
finally {
  Pop-Location
}
