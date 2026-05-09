# Integración API `laminado_v1` (opt-in)

- Campo nuevo request: `adicional_laminado` (opcional)
- Valores: `sin_adicional | laca | laminado_brillo | laminado_mate`
- Si no se envía: se asume `sin_adicional` y no cambia comportamiento previo.

## Fórmula aplicada
- `total_sin_iva = (precio_unitario_base + adicional_unitario_sin_iva) * cantidad_unidades`
- `total_con_urgencia = total_sin_iva * factor_urgencia`

## Compatibilidad
- Se mantienen campos históricos (`precio_unitario_sin_iva`, `precio_unitario_con_urgencia`, etc.).
- Se agregan campos nuevos de adicional para trazabilidad y detalle.

