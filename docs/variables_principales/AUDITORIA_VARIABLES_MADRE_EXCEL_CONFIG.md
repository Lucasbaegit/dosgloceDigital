# Auditor?a de variables madre Excel/config
Esta auditor?a separa variables madre editables de valores derivados, tablas PDF fijas y candidatos sin costo base confiable. No se modifica el Excel ni el PDF.
## Criterio
- Confiabilidad alta: valor en config operativa usada por alg?n motor actual.
- Confiabilidad media: valor num?rico encontrado en Excel hist?rico, persistido en JSON preparado, pero sin impacto actual.
- Confiabilidad baja o sin valor: no se expone como editable.
- Los factores de ajuste PDF, rangos y matrices finales no son variables madre.
## Variables editables finales
| Variable | Fuente | Valor | Unidad | Editable | Impacta hoy | Confiabilidad | Motivo |
|---|---|---:|---|---|---|---|---|
| `tipo_cambio_usd` | dolar_actual | 1410.0 | ARS/USD | s? | no | alta | Tipo de cambio comercial de referencia. |
| `click_color` | variables.click_color_base | 3.0 | ARS | s? | s? | alta | Click color base usado en f?rmulas variables calibradas. |
| `click_color_a3_excel` | Bajadas!AM42 | 195.0 | ARS | s? | no | media | Costo de click color A3 detectado en Excel histórico. Preparado para fórmulas futuras; no está conectado al motor actual. |
| `click_bn_excel` | Bajadas!AM45 | 39.0 | ARS | s? | no | media | Costo de click blanco y negro detectado en Excel histórico. Preparado para fórmulas futuras; no está conectado al motor actual. |
| `obra_90g` | variables.material_base.obra_ilustracion_90g | 14.0 | USD | s? | s? | alta | Costo base real del material usado en f?rmula editable de Stickers Circulares. |
| `obra_80g_65x95_usd` | PAPEL US$!E4 | 0.0988 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `obra_90g_65x95_usd` | PAPEL US$!E5 | 0.11115 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `obra_90g_72x102_usd` | PAPEL US$!E7 | 0.132192 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `ilustracion_90g_65x95_usd` | PAPEL US$!E10 | 0.11115 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `ilustracion_115g_65x95_usd` | PAPEL US$!E11 | 0.142025 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `ilustracion_150g_65x95_usd` | PAPEL US$!E12 | 0.18525 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `ilustracion_200g_65x95_usd` | PAPEL US$!E13 | 0.2717 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `ilustracion_150g_72x102_usd` | PAPEL US$!E17 | 0.22032 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `ilustracion_200g_72x102_usd` | PAPEL US$!E18 | 0.323136 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `ilustracion_300g_65x95_usd` | PAPEL US$!E20 | 0.3705 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `ilustracion_350g_65x95_usd` | PAPEL US$!E23 | 0.43225 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `triplex_325g_68x96_usd` | PAPEL US$!E29 | 0.43316 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `autoadhesivo_90g_50x65_usd` | PAPEL US$!E31 | 0.5 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `autoadhesivo_90g_100x70_usd` | PAPEL US$!E33 | 0.9 | USD | s? | no | media | Costo base USD detectado en hoja PAPEL US$. Preparado; no impacta precios PDF fijos. |
| `multiplicador_general` | variables.multiplicador_comercial | 1.0 | factor | s? | s? | alta | Multiplicador comercial general de f?rmulas variables calibradas. |
| `adicional_tinta_blanca_base_1_copia` | adicional_tinta_blanca_base_1_copia | 603.0 | ARS/unidad | s? | s? | alta | Valor unitario proporcional del adicional Tinta Blanca. |
| `laca_digital_aqualina_usd` | PAPEL US$!E47 | 28.0 | USD | s? | no | media | Costo base histórico de laca digital detectado en Excel. Preparado; la Laca UV productiva actual usa matriz validada por rango. |

## Variables descartadas
| Variable candidata | Fuente | Editable | Motivo |
|---|---|---|---|
| `opp_blanco_usd` | PAPEL US$!B36:F36 | no | Fila PAPEL US$!36 contiene dos valores cercanos (E36=1.4 y F36=1.3) y fórmulas derivadas; no se expone hasta confirmar cuál es costo base. |
| `opp_clear_usd` | PAPEL US$!B37 | no | Detectado en PAPEL US$!B37, pero sin valor numérico confiable. |
| `kraft_80g_usd` | PAPEL US$!B40:E40 | no | Detectado como texto kg u$s 2,21 en PAPEL US$!E40, pero no hay costo por hoja/pliego ni medida cerrada confiable. |
| `kraft_200g_usd` | PAPEL US$!B41 | no | Detectado en PAPEL US$!B41, sin valor numérico confiable. |
| `papel_fluo_usd` | PDF/datasets finales | no | No se encontró costo base confiable; solo aparece como producto/material en tablas finales. |
| `factor_ajuste_pdf` | data/stickers_circulares/factores_ajuste_pdf.json | no | Es calibración/factor de ajuste, no variable madre editable. |

## Papeles detectados sin costo base
| Familia | Papel | Estado | Motivo | Relacionadas |
|---|---|---|---|---|
| Papeles Bajadas | `obra_80g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | obra_80g_65x95_usd |
| Papeles Bajadas | `ilustracion_90g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | ilustracion_90g_65x95_usd |
| Papeles Bajadas | `ilustracion_115g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | ilustracion_115g_65x95_usd |
| Papeles Bajadas | `ilustracion_150g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | ilustracion_150g_65x95_usd, ilustracion_150g_72x102_usd |
| Papeles Bajadas | `ilustracion_200g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | ilustracion_200g_65x95_usd, ilustracion_200g_72x102_usd |
| Papeles Bajadas | `ilustracion_250g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | - |
| Papeles Bajadas | `ilustracion_300g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | ilustracion_300g_65x95_usd |
| Papeles Bajadas | `ilustracion_350g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | ilustracion_350g_65x95_usd |
| Papeles Bajadas | `triplex_350g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | - |
| Papeles Bajadas | `kraft_80g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | - |
| Papeles Bajadas | `kraft_200g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | - |
| Papeles Autoadhesivas | `autoadhesivo_obra_90g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | obra_90g_65x95_usd, obra_90g_72x102_usd |
| Papeles Autoadhesivas | `autoadhesivo_ilustracion_90g` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | ilustracion_90g_65x95_usd |
| Papeles Autoadhesivas | `opp_blanco` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | - |
| Papeles Autoadhesivas | `opp_clear` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | - |
| Papeles Autoadhesivas | `papel_kraft_marron` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | - |
| Papeles Autoadhesivas | `papel_fluo` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | - |
| Papeles Productos | `papel_300g_ilustracion` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | - |
| Papeles Productos | `papel_150g_ilustracion` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | - |
| Papeles Productos | `papel_80g_ilustracion` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | - |
| Papeles Productos | `papel_63g_sobres` | detectado_sin_costo_base | Detectado en tablas PDF, pero no existe costo base confiable en USD. | - |

## Hallazgos principales
- Se encontraron costos base confiables en Excel hoja `PAPEL US$` para varios papeles por medida. Se guardan en `data/variables_principales/variables_madre.json` como variables preparadas.
- Se encontraron clicks hist?ricos en `Bajadas!AM42` y `Bajadas!AM45`; quedan preparados porque no reemplazan la f?rmula actual ni matrices PDF.
- OPP, Kraft y fl?o no se abrieron como editables cuando no hubo valor base inequ?voco.
- Las matrices PDF, rangos y factores de ajuste no se exponen como variables madre.
