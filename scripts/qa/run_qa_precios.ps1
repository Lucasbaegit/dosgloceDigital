$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $projectRoot

$baseUrl = "http://127.0.0.1:8000"
$outputDir = ".\reports\qa"

Write-Host "Proyecto: $projectRoot"
Write-Host "Ejecutando QA masivo..."

python .\scripts\qa\qa_precios_masivo.py --base-url $baseUrl --output-dir $outputDir --only all
$exitCode = $LASTEXITCODE

Write-Host "Reportes en: $outputDir"
exit $exitCode
