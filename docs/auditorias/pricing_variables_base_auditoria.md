# Auditoría base de variables comerciales (etapa sin impacto en precio)

Fecha: 2026-05-13  
Alcance: Bajadas Kraft, Tarjetas 9x5, Tarjetas Postales, Folletos.

## Resultado
- Se mantuvo el cálculo actual sin cambios de precio.
- Se enriqueció la trazabilidad para productos con matriz PDF.
- Se agregó una capa base (`data/variables_comerciales/*` + `src/pricing_variables`) para preparar modo editable futuro.

## Productos por modo de cálculo actual
- `Bajadas Kraft`: matriz PDF específica (override controlado sobre `SIN_COMPARACION`).
- `Tarjetas 9x5`: matriz PDF (página 12).
- `Tarjetas Postales`: matriz PDF (página 12).
- `Folletos`: matriz PDF (página 13).

## Variables detectadas (históricas) para futura calibración
- Dólar.
- Papel (300g, 150g, 80g según producto).
- Click color / click ByN.
- Costos de terminación (laca UV, laminado brillo, laminado mate).
- Coeficientes por cantidad.
- Coeficientes por tamaño (folletos).
- Multiplicador comercial.
- Factor de ajuste PDF.

## Convención actual (sin cambio)
- Fuente final de precio: PDF vigente.
- Modo actual: `modo_precio=pdf_fijo`.
- Modo futuro preparado: `futuro_modo_precio=formula_editable_calibrada`.

