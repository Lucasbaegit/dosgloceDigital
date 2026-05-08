# 12 - Aplicaci?n correcci?n XL ByN 1/1

## Qu? se cambi?
- Se cre? un m?dulo reusable de correcci?n de f?rmula para el caso **XL + blanco_y_negro + 1/1**.
- Se reemplaz? la l?gica inline de correcci?n en la auditor?a por el nuevo m?dulo.
- Se agreg? trazabilidad expl?cita por caso:
  - `formula_original_detectada`
  - `formula_corregida`
  - `motivo`
  - `componente_corregido`

## Por qu? se cambi?
- En XL ByN 1/1 el patr?n hist?rico era:
  - **Antes:** `(paper + variable) * AH * AG`
- En A3+, XA3 y A4 (1/1) el patr?n consistente es:
  - `(variable*AG + paper) * AH`
- Se aplic? la correcci?n l?gica para mantener consistencia estructural:
  - **Despu?s:** `(paper + variable*AG) * AH`

## Archivos tocados
- `scripts/bajadas_v2/xl_byn_1_1_correction.py` (nuevo)
- `scripts/bajadas_v2/auditar_simular_xl_byn_1_1.py` (actualizado)
- `scripts/bajadas_v2/test_xl_byn_1_1_correction.py` (nuevo test)

## Tests ejecutados
- `python scripts\bajadas_v2\test_xl_byn_1_1_correction.py`
- Resultado: `OK 6 tests`

## Resultados antes/despu?s (segmento XL ByN 1/1)
- Casos simulados: `48`
- Comparables: `40`
- DIFERENCIA_ALTA antes (Escenario A): `40`
- DIFERENCIA_ALTA despu?s (Escenario B/C): `40`
- Error promedio absoluto:
  - A: `46531.14%`
  - B/C: `27342.35%`
- Mejora media: `~19188.80` puntos porcentuales.

## Advertencia
- La correcci?n **reduce la magnitud del error**, pero **no elimina** el conteo de `DIFERENCIA_ALTA`.

## Pr?ximo paso recomendado
- Evaluar regla especial para XL ByN por segmento `liviano/pesado` y/o por `1/1`, manteniendo esta correcci?n l?gica como base.
