# Recomendación de modelo (futura integración)

## Opciones de adicional
- `sin_adicional`
- `adicional_laca`
- `adicional_laminado_brillo`
- `adicional_laminado_mate`

## Regla de cálculo propuesta
- `total = (precio_base + adicional_unitario * cantidad_unidades) * factor_urgencia`
- El adicional se calcula **antes** de urgencia.
- No se permite combinar múltiples adicionales en una misma cotización.

## Derivación por formato
- Tomar `A3+` como base de cálculo del adicional (coherente con hoja Laminado).
- Derivar a otros formatos con los mismos factores de conversión usados en Bajadas v2 (misma filosofía de escalado por formato).

## Qué guardar en trazabilidad
- adicional elegido
- rango aplicado
- origen técnico en Excel (`C7:C13` brillo / `D7:D13` mate / `E7:E13` laca)
- fórmula patrón
- coeficientes usados (`D2`, `I2`, `Lx`)
- exclusión de combinaciones múltiples

## Notas
- Esta etapa no integra al motor productivo.
- Tinta blanca, precorte, medio corte y otros acabados quedan fuera de este análisis.
