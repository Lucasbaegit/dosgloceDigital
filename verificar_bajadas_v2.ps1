param(
    [string]$ProjectRoot = "C:\Users\baezl\Desktop\proyectos\desgloceExcel\excel_desfloce",
    [string]$ApiUrl = "http://127.0.0.1:8000",
    [string]$FrontendUrl = "http://127.0.0.1:5174"
)

$ErrorActionPreference = "Stop"

function Step($msg) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor DarkGray
    Write-Host $msg -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor DarkGray
}

function Ok($msg) {
    Write-Host "[OK] $msg" -ForegroundColor Green
}

function Fail($msg) {
    Write-Host "[FAIL] $msg" -ForegroundColor Red
    exit 1
}

function Test-Url($url, $name) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            Ok "$name responde: $url"
        } else {
            Fail "$name respondió con status $($response.StatusCode): $url"
        }
    } catch {
        Fail "$name no responde: $url | $($_.Exception.Message)"
    }
}

Step "Entrando al proyecto"
Set-Location $ProjectRoot
Ok "Proyecto: $ProjectRoot"

Step "Verificando API levantada"
Test-Url "$ApiUrl/health" "API /health"
Test-Url "$ApiUrl/bajadas-v2/health" "API /bajadas-v2/health"

Step "Verificando frontend levantado"
Test-Url $FrontendUrl "Frontend"

Step "Validando motor Bajadas v2"
python scripts\bajadas_v2\validar_bajadas_v2.py
if ($LASTEXITCODE -ne 0) {
    Fail "validar_bajadas_v2.py falló"
}
Ok "Motor Bajadas v2 PASS"

Step "Ejecutando tests API"
python -m unittest discover -s tests\api -p "test_*.py"
if ($LASTEXITCODE -ne 0) {
    Fail "Tests API fallaron"
}
Ok "Tests API PASS"

Step "Ejecutando E2E con API y frontend existentes"
python scripts\bajadas_v2\run_e2e_stack.py --use-existing-api $ApiUrl --use-existing-frontend $FrontendUrl
if ($LASTEXITCODE -ne 0) {
    Fail "E2E falló"
}
Ok "E2E PASS"

Step "RESULTADO FINAL"
Write-Host "Bajadas v2 verificado correctamente." -ForegroundColor Green
Write-Host "API: $ApiUrl" -ForegroundColor Green
Write-Host "Frontend: $FrontendUrl" -ForegroundColor Green
