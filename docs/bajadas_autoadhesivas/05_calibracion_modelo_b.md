# 05 Calibración Modelo B - Autoadhesivas

## Umbrales
- OK <= 1%
- DIFERENCIA_LEVE <= 3%
- DIFERENCIA_MEDIA <= 7%
- DIFERENCIA_ALTA > 7%

## Factores B1
- factor_autoadhesivo_papel: `0.001800177180`
- factor_autoadhesivo_especial: `1.180218291402`
- Resumen B1 global: `{'counts': {'OK': 2, 'DIFERENCIA_LEVE': 2, 'DIFERENCIA_MEDIA': 4, 'DIFERENCIA_ALTA': 6}, 'error_promedio_abs_pct': 6.72123219260645, 'error_mediano_abs_pct': 5.450195144836708, 'error_max_abs_pct': 13.80174304388847}`

## Factores B2 (por rango)
- Papel:
  - `1`: `0.002042442295`
  - `2 a 25`: `0.001868464379`
  - `26 a 50`: `0.001817279779`
  - `51 a 100`: `0.001765164991`
  - `101 a 300`: `0.001707345920`
  - `301 a 500`: `0.001645672245`
  - `501 a 1000`: `0.001582248771`
- Especial:
  - `1`: `1.339218342149`
  - `2 a 25`: `1.224405653089`
  - `26 a 50`: `1.191997142296`
  - `51 a 100`: `1.156678112500`
  - `101 a 300`: `1.119080435619`
  - `301 a 500`: `1.079920233165`
  - `501 a 1000`: `1.037082789626`
- Resumen B2 global: `{'counts': {'OK': 14, 'DIFERENCIA_LEVE': 0, 'DIFERENCIA_MEDIA': 0, 'DIFERENCIA_ALTA': 0}, 'error_promedio_abs_pct': 0.0, 'error_mediano_abs_pct': 0.0, 'error_max_abs_pct': 0.0}`

## Factores B3 (familia de rango)
- Papel `tirada_corta`: `0.001921455455`
- Papel `tirada_media`: `0.001737172987`
- Papel `tirada_larga`: `0.001615035173`
- Especial `tirada_corta`: `1.259780186770`
- Especial `tirada_media`: `1.138475912257`
- Especial `tirada_larga`: `1.059227361243`
- Resumen B3 global: `{'counts': {'OK': 0, 'DIFERENCIA_LEVE': 10, 'DIFERENCIA_MEDIA': 4, 'DIFERENCIA_ALTA': 0}, 'error_promedio_abs_pct': 3.1160268184110027, 'error_mediano_abs_pct': 2.103707369615921, 'error_max_abs_pct': 5.931680658692488}`

## Evaluación papel
- Median(base/target) papel: `566.52`
- Estado: `PAPEL_FORMULA_EXCEL_NO_USABLE_DIRECTA`
## Evaluación especial
- La columna especial es calibrable manteniendo estructura de fórmula U4:U10.

## Recomendación
- Papel: híbrido B→C (trazabilidad Excel + tabla calibrada operativa).
- Especial: Modelo B3 por familia de rango.