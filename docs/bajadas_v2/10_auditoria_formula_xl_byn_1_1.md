# 10 - Auditoría fórmula XL ByN 1/1

- Se trabajó en modo simulación/auditoría. No se modificó el Excel.

## Fórmula problemática
- Patrón XL ByN 1/1 detectado: `(paper + variable) * AH * AG`
- Patrón esperado (consistente con A3+/XA3/A4 1/1): `(paper + variable*AG) * AH`
- Componente fuera del paréntesis: `AG48`.

## Celdas XL ByN 1/1 afectadas
- D65, D66, D67, D68, D69, D70, F65, F66, F67, F68, F69, F70, H65, H66, H67, H68, H69, H70, J65, J66, J67, J68, J69, J70, L65, L66, L67, L68, L69, L70, N65, N66, N67, N68, N69, N70, P65, P66, P67, P68, P69, P70, R65, R66, R67, R68, R69, R70

## Comparación estructural
- A3+ 1/1: `(variable*AG + papel) * AH`
- XA3 1/1: `(variable*AG + papel) * AH`
- A4 1/1: `(variable*AG + papel) * AH`
- XL 1/1 actual: `(variable + papel) * AH * AG`
- XL 1/1 esperado: `(variable*AG + papel) * AH`