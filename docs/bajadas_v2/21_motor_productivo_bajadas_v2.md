# Motor productivo Bajadas v2

## Objetivo
Implementar un motor de cotización productivo que use la configuración final congelada de Bajadas v2 y devuelva precio sin IVA + trazabilidad completa.

## Arquitectura
- `src/bajadas_v2/types.py`: contratos de entrada/salida (`QuoteInput`, `QuoteResult`, `QuoteTrace`).
- `src/bajadas_v2/config_loader.py`: carga y validación mínima de:
  - `data/bajadas_v2/bajadas_v2_config_final.json`
  - `data/bajadas_v2/comparativa_bajadas_v2_final.json`
  - `data/bajadas_v2/precios_pdf_objetivo_validado.json`
- `src/bajadas_v2/pricing_engine.py`: resolución de precio y recargo de urgencia.
- `src/bajadas_v2/trace.py`: normalización de clave compuesta de búsqueda.
- `src/bajadas_v2/exceptions.py`: excepciones de dominio.
- `scripts/bajadas_v2/cotizar_bajada_v2.py`: CLI para cotización manual.

## Reglas implementadas
- Baseline: `Modelo D / D2` congelado.
- `factor_xa3 = 1.10` (traza explícita para formato XA3).
- Regla especial `XL ByN` por `tipo_papel + caras`.
- Corrección lógica activa en traza: `CORRECCION_XL_BYN_1_1_PARENTESIS`.
- Casos `MD7-01..MD7-07` con `PRECIO_FIJO_CSV`.
- Recargos:
  - `normal`: 0
  - `express`: 0.15
  - `super_express`: 0.30
  - `ya_24hs`: 0.50

## Contrato de entrada
Campos requeridos:
- `categoria`
- `modo_color`
- `formato`
- `tipo_papel`
- `material`
- `gramaje`
- `cantidad_rango`
- `caras`
- `terminacion` (opcional)
- `urgencia` (`normal|express|super_express|ya_24hs`)

## Contrato de salida
- `precio_sin_iva`
- `precio_con_recargo_urgencia`
- `regla_aplicada`
- `fuente` (`modelo_d|precio_fijo_csv`)
- `trazabilidad`:
  - `base_formato`
  - `factor_aplicado`
  - `regla_especial`
  - `correccion_logica`
  - `precio_objetivo_csv`
  - `recargo_urgencia_aplicado`
  - `an40_estado`

## Ejemplo CLI
```powershell
python scripts\bajadas_v2\cotizar_bajada_v2.py `
  --categoria "Bajadas Blanco y Negro" `
  --modo-color "blanco_y_negro" `
  --formato "XL" `
  --tipo-papel "pesado" `
  --material "Triplex" `
  --gramaje "Triplex" `
  --cantidad-rango "2 a 50" `
  --caras "1/0" `
  --urgencia "express"
```

## Tests
- `tests/bajadas_v2/test_config_loader.py`
- `tests/bajadas_v2/test_pricing_engine.py`
- `tests/bajadas_v2/test_precio_fijo_csv.py`
- `tests/bajadas_v2/test_regla_xl_byn.py`
- `tests/bajadas_v2/test_recargos_urgencia.py`
