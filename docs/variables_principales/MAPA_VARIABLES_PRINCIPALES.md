# Mapa de variables principales

La pantalla **Variables principales** separa tres niveles:

- **Variables madre editables**: costos base y parámetros comerciales controlados.
- **Variables derivadas / valores calculados**: precios finales, urgencias, recargos y resultados por rango.
- **Tablas fijas PDF**: matrices finales cerradas desde `lista-low.pdf`.

No permite editar matrices PDF, factores de ajuste PDF, coeficientes internos ni precios finales.

## Variables editables

| Variable visible | Clave API | Archivo real | Ruta interna | Impacta hoy |
| --- | --- | --- | --- | --- |
| Tipo de cambio USD | `tipo_cambio_usd` | `data/bajadas_v2/bajadas_v2_config_final.json` | `dolar_actual` | Queda preparado; no cambia productos PDF fijos |
| Click color | `click_color` | `data/stickers_circulares/formula_editable_config.json` | `variables.click_color_base` | Cambia el precio base estimado y la traza de Stickers Circulares |
| Papel obra/ilustración 90g | `obra_90g` | `data/stickers_circulares/formula_editable_config.json` | `variables.material_base.obra_ilustracion_90g` | Cambia el precio base estimado y la traza de Stickers Circulares |
| Multiplicador comercial general | `multiplicador_general` | `data/stickers_circulares/formula_editable_config.json` | `variables.multiplicador_comercial` | Cambia el precio base estimado y la traza de Stickers Circulares |
| Tinta blanca Autoadhesivas (1 copia) | `adicional_tinta_blanca_base_1_copia` | `data/bajadas_autoadhesivas/autoadhesivas_v1_config.json` | `adicional_tinta_blanca_base_1_copia` | Cambia inmediatamente el subtotal de Tinta Blanca |

## Papeles detectados no editables

Los papeles que aparecen en tablas PDF pero no tienen costo base confiable en USD se muestran como `detectado_sin_costo_base`. No son editables y no se activan manualmente.

Ejemplos: ilustración 150g, ilustración 300g, Kraft 80g, Kraft 200g, OPP blanco/clear, papel 63g sobres.

## Variables derivadas y tablas fijas

Los precios finales por rango, recargos de urgencia, matrices de productos y rangos comerciales son no editables. Se muestran como `derivado`, `tabla_fija_pdf` o `rango_fijo`.

## Rangos y exportación

- `GET /variables-principales/rangos` muestra los rangos comerciales por familia, únicamente para control, con `tipo: rango_fijo`.
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
