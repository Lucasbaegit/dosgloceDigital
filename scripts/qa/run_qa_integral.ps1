$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $projectRoot

$baseUrl = "http://127.0.0.1:8000"
$frontendUrl = "http://127.0.0.1:5174"
$outputDir = ".\reports\qa"

Write-Host "Proyecto: $projectRoot"
Write-Host "Ejecutando QA integral funcional..."

python .\scripts\qa\qa_integral_app.py --base-url $baseUrl --frontend-url $frontendUrl --output-dir $outputDir
$exitCode = $LASTEXITCODE

Write-Host "Reportes en: $outputDir"
exit $exitCode
