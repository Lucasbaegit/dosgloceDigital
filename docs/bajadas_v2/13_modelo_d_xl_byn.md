# 13 - Modelo D XL ByN

- Modelo C se mantiene como baseline general.
- Se activa corrección lógica XL ByN 1/1: CORRECCION_XL_BYN_1_1_PARENTESIS.
- Recalibración exclusiva del segmento Bajadas Blanco y Negro / XL.
- No afecta A3+, XA3, A4, fullcolor, autoadhesivas, terminaciones, Kraft.

## Variante D1 (tipo_papel)
- OK: 475
- DIFERENCIA_LEVE: 44
- DIFERENCIA_MEDIA: 47
- DIFERENCIA_ALTA: 58
- SIN_COMPARACION: 48
- error promedio: 2.3892792382588945
- error mediano: 0.34752730173708535
- diferencia máxima: 24.049924527781716

## Variante D2 (tipo_papel + caras)
- OK: 526
- DIFERENCIA_LEVE: 51
- DIFERENCIA_MEDIA: 40
- DIFERENCIA_ALTA: 7
- SIN_COMPARACION: 48
- error promedio: 1.1396654568594209
- error mediano: 0.26024875895331573
- diferencia máxima: 14.89218410890538

## Variante D3
- No ejecutada: D2 no superó umbral de "muchas altas" definido.

## Variante elegida: D2
- Factores XL ByN aplicados: {'liviano|1/0': 1.9146540157178455, 'liviano|1/1': 2.2423559796255113, 'pesado|1/0': 1.8553509037156486, 'pesado|1/1': 2.428106640886443, 'global': 1.9407645534290272}