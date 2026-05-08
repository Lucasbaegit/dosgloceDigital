# Validación automática y snapshot Bajadas v2

## Objetivo
Detectar drift futuro en el motor productivo sin cambiar reglas de negocio ni fuentes.

## Scripts
- `scripts/bajadas_v2/generar_regresion_bajadas_v2.py`
- `scripts/bajadas_v2/snapshot_metricas_bajadas_v2.py`
- `scripts/bajadas_v2/validar_bajadas_v2.py`

## Snapshot generado
Ruta:
- `data/bajadas_v2/snapshots/bajadas_v2_metrics_snapshot.json`

Incluye:
- `fecha_generacion`
- `cantidad_total_comparativa`
- `conteo_estados` (`OK`, `DIFERENCIA_LEVE`, `DIFERENCIA_MEDIA`, `DIFERENCIA_ALTA`, `SIN_COMPARACION`)
- `cantidad_casos_regresion`
- `cantidad_precio_fijo_csv`
- `cantidad_reglas_especiales`
- `config_version` (si existe)
- checksums SHA-256 de:
  - `bajadas_v2_config_final.json`
  - `precios_pdf_objetivo_validado.json`
  - `regresion_bajadas_v2_cases.json`

## Test de snapshot
Archivo:
- `tests/bajadas_v2/test_metricas_snapshot_bajadas_v2.py`

Valida:
- `DIFERENCIA_ALTA == 0`
- `casos_regresion >= 624`
- `OK >= 533`
- `cantidad_precio_fijo_csv == 7`
- existencia de archivos críticos
- hashes válidos y recomputables

## Ejecución local
```powershell
cd C:\Users\baezl\Desktop\proyectos\desgloceExcel\excel_desfloce

python scripts\bajadas_v2\generar_regresion_bajadas_v2.py
python scripts\bajadas_v2\snapshot_metricas_bajadas_v2.py
python -m unittest discover -s tests\bajadas_v2 -p "test_*.py"
python scripts\bajadas_v2\validar_bajadas_v2.py
```

## CI
No se detectó estructura CI (`.github/workflows`) en este repositorio.
El script `validar_bajadas_v2.py` queda preparado como comando único para integrar en CI cuando se habilite pipeline.
