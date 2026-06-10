# Mapa de variables principales

La pantalla **Variables principales** expone solamente valores comerciales numéricos que ya existen en archivos operativos. No permite editar matrices PDF, factores de ajuste PDF, coeficientes internos ni fórmulas.

## Variables editables

| Variable visible | Clave API | Archivo real | Ruta interna | Impacta hoy |
| --- | --- | --- | --- | --- |
| Tipo de cambio USD | `tipo_cambio_usd` | `data/bajadas_v2/bajadas_v2_config_final.json` | `dolar_actual` | Queda preparado; no cambia productos PDF fijos |
| Click color | `click_color` | `data/stickers_circulares/formula_editable_config.json` | `variables.click_color_base` | Cambia el precio base estimado y la traza de Stickers Circulares |
| Papel obra/ilustración 90g | `obra_90g` | `data/stickers_circulares/formula_editable_config.json` | `variables.material_base.obra_ilustracion_90g` | Cambia el precio base estimado y la traza de Stickers Circulares |
| Multiplicador comercial general | `multiplicador_general` | `data/stickers_circulares/formula_editable_config.json` | `variables.multiplicador_comercial` | Cambia el precio base estimado y la traza de Stickers Circulares |
| Tinta blanca Autoadhesivas (1 copia) | `adicional_tinta_blanca_base_1_copia` | `data/bajadas_autoadhesivas/autoadhesivas_v1_config.json` | `adicional_tinta_blanca_base_1_copia` | Cambia inmediatamente el subtotal de Tinta Blanca |

## Variables esperadas todavía no expuestas

`click_bn`, papeles principales sin valor numérico operativo y multiplicadores por familia aparecen en la auditoría como no encontrados. Se excluyen de edición hasta que exista una fuente confiable y una ruta de persistencia única.

La UI muestra además un inventario agrupado de papeles detectados. Los que no poseen valor numérico confiable aparecen como **No editable**.

## Rangos y exportación

- `GET /variables-principales/rangos` muestra los rangos comerciales por familia, únicamente para control.
- `GET /export/precios/json` normaliza las matrices internas activas y productos bloqueados.
- `GET /export/precios/pdf` genera una lista legible desde esa estructura, sin capturas de pantalla.
- Membretes y terminaciones de tarjetas permanecen marcados como bloqueados.
- DTF UV, DTF Textil y PegaManía quedan excluidos.

## Seguridad y persistencia

- `GET /variables-principales` devuelve el catálogo controlado.
- `PUT /variables-principales` acepta únicamente claves del catálogo, números positivos y valores dentro de sus límites.
- Antes de escribir se crea un respaldo en `data/backups/variables_principales/`.
- `POST /variables-principales/reset` restaura un backup compatible; no se expone como botón en la UI.
- `GET /variables-principales/audit` informa archivos mapeados, fechas y variables faltantes.

## Precios PDF fijos

Los productos cuyo precio final sigue en modo PDF fijo no cambian silenciosamente al editar estas variables. Stickers Circulares conserva el precio PDF calibrado, aunque su precio base estimado y trazabilidad reflejan las variables nuevas.
