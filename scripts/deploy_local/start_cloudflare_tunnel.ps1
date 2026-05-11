param(
  [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$cf = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cf) {
  Write-Host "[FAIL] Instalar cloudflared o agregarlo al PATH" -ForegroundColor Red
  exit 1
}

Write-Host "[INFO] Iniciando túnel rápido a http://127.0.0.1:$Port ..."
Write-Host "[INFO] La URL de trycloudflare cambia en cada reinicio del túnel."
cloudflared tunnel --url "http://127.0.0.1:$Port"
