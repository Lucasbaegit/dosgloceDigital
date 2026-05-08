# 11 - Simulación corrección XL ByN 1/1

- Casos simulados: 48
- Diferencias altas antes (A): 40
- Diferencias altas después (B/C): 40
- Mejora promedio (% abs): 19188.7955

## Métricas por escenario
- Escenario A: {'OK': 0, 'DIFERENCIA_LEVE': 0, 'DIFERENCIA_MEDIA': 0, 'DIFERENCIA_ALTA': 40, 'SIN_COMPARACION': 8, 'error_promedio_pct_abs': 46531.14313976643, 'error_mediano_pct_abs': 47829.08602484473, 'error_max_pct_abs': 86399.60829073483}
- Escenario B: {'OK': 0, 'DIFERENCIA_LEVE': 0, 'DIFERENCIA_MEDIA': 0, 'DIFERENCIA_ALTA': 40, 'SIN_COMPARACION': 8, 'error_promedio_pct_abs': 27342.34759497563, 'error_mediano_pct_abs': 28105.110449689444, 'error_max_pct_abs': 50795.20559105431}
- Escenario C: {'OK': 0, 'DIFERENCIA_LEVE': 0, 'DIFERENCIA_MEDIA': 0, 'DIFERENCIA_ALTA': 40, 'SIN_COMPARACION': 8, 'error_promedio_pct_abs': 27342.34759497563, 'error_mediano_pct_abs': 28105.110449689444, 'error_max_pct_abs': 50795.20559105431}

## Recomendación preliminar
- Si la corrección reduce materialmente DIFERENCIA_ALTA, aplicar corrección lógica en Bajadas v2 antes de crear regla especial.
- Si no alcanza, recién ahí evaluar regla especial XL ByN.