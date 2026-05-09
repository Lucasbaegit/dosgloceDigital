# Trazabilidad `laminado_v1`

## Campos de trazabilidad incluidos
- `hoja_origen`: `Laminado`
- `rango_origen`: `A1:R29`
- `celda_origen` por tramo (ej. `E8`, `C8`, `D8`)
- `formula_origen`:
  - laca: `Cx/I2`
  - brillo: `C5*Lx*D2`
  - mate: `Cx*D2`
- `escala` aplicada
- `dependencias`:
  - `C5`
  - `D2`
  - `I2`
  - `Lx`
  - `Cx` (si corresponde)
- `precio_por_pliego_a3plus = true`
- `adicional_no_combinable = true`
- nota de negocio: “adicional se suma antes de urgencia”

## Notas de interpretación
- No hay dependencias externas directas detectadas en fórmulas (otras hojas/archivos).
- Duplicado `1001+` registrado como `PENDIENTE_INTERPRETACION` con resolución operativa temporal en fila 13.

