# Bajadas v2 + adicionales Laminado (fase opt-in)

Se integró el módulo `src/bajadas_adicionales_laminado` al flujo de cotización API mediante un esquema opt-in por request.

## Estado
- No rompe cotizaciones existentes si no se envía `adicional_laminado`.
- Aplica también a cotizaciones Autoadhesivas (papel/especial) por la misma ruta API.
- No hay integración obligatoria en frontend en esta etapa.

## Campos nuevos response
- `adicional_laminado`
- `adicional_unitario_sin_iva`
- `adicional_unitario_con_urgencia`
- `total_adicional_sin_iva`
- `total_adicional_con_urgencia`
- `precio_unitario_base_sin_iva`
- `precio_unitario_con_adicional_sin_iva`
- `regla_adicional_aplicada`
- `fuente_adicional`

