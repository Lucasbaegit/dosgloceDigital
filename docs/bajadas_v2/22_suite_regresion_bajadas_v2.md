# Suite de regresión Bajadas v2

## Objetivo
Validar que el motor productivo reproduce los precios esperados del baseline final (`comparativa_bajadas_v2_final.json`) y detectar drift temprano.

## Generador de fixture
Script:
- `scripts/bajadas_v2/generar_regresion_bajadas_v2.py`

Salida:
- `tests/bajadas_v2/fixtures/regresion_bajadas_v2_cases.json`

### Modos
- `full` (default): incluye todos los casos con estado `OK`, `DIFERENCIA_LEVE`, `DIFERENCIA_MEDIA`.
- `sample`: muestra estratificada por `modo_color + formato`.

### Contenido del fixture
- Casos con `urgencia=normal` como base.
- Incluye explícitamente:
  - precios fijos CSV (`precio_fijo_csv_aplicado=true`)
  - segmento XL ByN
  - A3+
  - A4
  - fullcolor
  - blanco_y_negro

## Test de regresión
Archivo:
- `tests/bajadas_v2/test_regresion_bajadas_v2.py`

Valida:
- `precio_sin_iva` del motor vs esperado del fixture.
- Tolerancias:
  - absoluta: `1.0` peso
  - porcentual: `0.5%`
- Si falla, imprime top 20 casos con delta absoluto/porcentual.

También valida urgencias en una muestra determinística:
- `normal`
- `express = base * 1.15`
- `super_express = base * 1.30`
- `ya_24hs = base * 1.50`

## Ejecución
```powershell
cd C:\Users\baezl\Desktop\proyectos\desgloceExcel\excel_desfloce

python scripts\bajadas_v2\generar_regresion_bajadas_v2.py

python -m unittest discover -s tests\bajadas_v2 -p "test_*.py"
```

## Notas de operación
- No usa OCR/PDF.
- No modifica Excel original ni CSV limpio.
- No altera reglas de negocio; sólo valida consistencia del motor contra baseline final.
