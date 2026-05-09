# Implementación `laminado_v1` (módulo aislado)

## Alcance
- Módulo nuevo: `src/bajadas_adicionales_laminado/`
- No integrado al motor productivo principal.
- No modifica reglas vigentes de Bajadas normales ni Autoadhesivas.

## Regla de cálculo aplicada
- `total_sin_iva = (precio_unitario_base + adicional_unitario) * cantidad_unidades` (si se informa `precio_unitario_base`)
- o `total_sin_iva = total_base + adicional_unitario * cantidad_unidades` (si se informa `total_base`)
- urgencia:
  - `total_con_urgencia = total_sin_iva * factor_urgencia`

## Adicionales soportados
- `sin_adicional`
- `laca`
- `laminado_brillo`
- `laminado_mate`

## Escalas operativas
- `0 - 10`
- `11 - 50`
- `51 - 100`
- `101 - 500`
- `501 - 1000`
- `1001+`

## Resolución del duplicado `1001+`
- En hoja `Laminado`, `B12` y `B13` muestran `1001 +`.
- Se deja estado `PENDIENTE_INTERPRETACION`.
- Resolución operativa adoptada:
  - usar fila 13 (`C13/D13/E13`) para `1001+`
  - motivo: continuidad decreciente de escala/costo.

