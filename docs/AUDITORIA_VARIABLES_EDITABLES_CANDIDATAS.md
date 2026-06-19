# Auditoria de variables editables candidatas

Proyecto: cotizador digital

Fecha de auditoria: 2026-06-19

Punto seguro anterior: `v-qa-integral-cotizador-ok`

## 1. Objetivo

Esta auditoria identifica variables, coeficientes, tablas y componentes de costo que podrian transformarse en editables en etapas futuras, sin implementar nuevas variables en esta corrida.

El criterio aplicado fue conservador:

- Los precios finales actuales siguen validados contra PDF/lista real.
- El Excel historico se usa como evidencia de logica, conexiones, formulas y variables.
- No se propone editar precios finales PDF ni matrices finales.
- No se habilita ninguna conexion solo por similitud de nombre.
- Toda variable candidata debe tener alcance, riesgo, evidencia y tests sugeridos.

## 2. Fuentes revisadas

### PDF/lista validada

- Fuente de precios finales: `lista-low.pdf`.
- Validacion operativa: QA integral y QA masivo de precios contra API local.

### Excel historico

Archivo revisado:

`C:\Users\baezl\Desktop\proyectos\desgloceExcel\Copia de DIGITAL sistema 2025.xlsx`

Hojas relevantes detectadas:

- `Pack`
- `Laminado`
- `corte`
- `circulares`
- `troquelados`
- `Bajadas`
- `PAPEL US$`
- `Adicionales`
- `carpetas`
- `Productos`
- `STICKERS IMANES`
- `COSTO MATERIAL`

### Codigo y datos actuales

- `src/pricing_variables/principal_variables.py`
- `src/pricing_trace/impact_map.py`
- `data/stickers_circulares/formula_editable_config.json`
- `data/stickers_circulares/factores_ajuste_pdf.json`
- `data/bajadas_autoadhesivas/autoadhesivas_v1_config.json`
- `scripts/qa/qa_integral_app.py`
- `docs/VALIDACION_CONEXIONES_EXCEL_HISTORICO.md`
- `docs/ARQUITECTURA_COTIZADOR_DIGITAL.md`
- `docs/GUIA_MODIFICACION_PRECIOS_COTIZADOR.md`

## 3. Variables operativas actuales

Las variables madre actualmente operativas deben mantenerse acotadas a los productos realmente conectados por codigo y evidencia historica.

| Variable | Estado actual | Evidencia repo | Observacion |
|---|---:|---|---|
| `tipo_cambio_usd` | operativa | `src/pricing_variables/principal_variables.py` | Variable general. No debe asumirse que todos los precios PDF fijos recalculan por dolar. |
| `click_color` | operativa | `src/pricing_variables/principal_variables.py` | Conectada de forma controlada al modelo editable actual, no a todas las matrices PDF. |
| `obra_90g` | operativa | `src/pricing_variables/principal_variables.py`, `data/stickers_circulares/formula_editable_config.json` | Conecta con Stickers Circulares. No se confirmo conexion con Autoadhesivas. |
| `multiplicador_general` | operativa | `src/pricing_variables/principal_variables.py` | Debe seguir tratandose como variable de alcance controlado. |
| `adicional_tinta_blanca_base_1_copia` | operativa | `data/bajadas_autoadhesivas/autoadhesivas_v1_config.json` | Base 1 copia para adicional proporcional de tinta blanca en Autoadhesivas. |

## 4. Evidencia principal del Excel historico

### Stickers Circulares

Hoja `circulares`:

- `circulares!O8` y `circulares!O22`: referencia a `CLICK A3+`.
- `circulares!Q22`: referencia a `CLICK FYD`.
- `circulares!P8`: referencia a `PAPEL`.
- `circulares!C8:K20`: formulas por diametro y cantidad.
- `circulares!O32:P37`: bloques de laminado por una y dos caras, con referencias a `Laminado`.
- `circulares!T32:Y37`: referencias a `troquelados` para calculos relacionados.

Conclusion: Stickers Circulares es el producto con mejor base para evolucionar a variables editables, porque ya existe formula editable calibrada y factores PDF por combinacion.

### Laminado, Laca UV y Plastificado

Hoja `Laminado`:

- `Laminado!B2`: `Laminado x lado`.
- `Laminado!E6`: `Laca UV`.
- Tabla de laca UV con valores historicos cercanos pero no identicos a la matriz comercial corregida actual.
- `Laminado!B14:G15`: `Plastificado x unid`, con medidas A4, Oficio y A3.
- `Laminado!B19`: adicional express historico de `+ 40%`.

Conclusion: hay logica historica, pero Bajadas hoy usa una matriz comercial corregida. Estas escalas deben exponerse, si se decide hacerlo, como tablas protegidas con preview y QA, no como escala libre ni porcentaje generico.

### Troquelado Digital

Hoja `troquelados`:

- Complejidades: simple, medio, complejo, muy complejo, ultra complejo.
- Rangos: `1 a 2`, `3 a 9`, `10 a 25`, `26 a 50`, `51 a 100`, `mas de 100`.
- Hay formulas y referencias para costos por complejidad/rango.

Conclusion: Troquelado Digital es candidato a tabla editable por rangos y complejidades, pero no como producto principal ni como variable escalar. Su uso actual como adicional de Bajadas es correcto.

### Papel y materiales

Hoja `PAPEL US$`:

- Bloque de obra 90g.
- Bloques de ilustracion por gramaje.
- Bloques de autoadhesivo 90.
- Bloques OPP blanco/clear.
- Bloques de laca digital e iman.

Conclusion: esta hoja confirma costos historicos de materiales, pero no confirma que todos esos costos afecten hoy los precios finales. Para productos PDF fijos, deben quedar como variables preparadas/no conectadas hasta reconstruir formula confiable.

### Adicionales de tarjetas

Hoja `Adicionales`:

- Se detectan `Puntas redondas` y `Agujereado`.
- Hay rangos y valores historicos, por ejemplo para tramos desde `1 a 100` hasta `501 a 1000`.

Conclusion: hay evidencia historica para terminaciones extra, pero se recomienda mantenerlas fuera de la operacion automatica hasta validar contra PDF/lista o criterio comercial vigente. La fuente historica sola no alcanza para modificar precios finales ya validados.

### Bajadas y Autoadhesivas

Hoja `Bajadas`:

- Contiene tablas A3+ y XA3, referencias a papeles, clicks y coeficientes.
- Se observan referencias separadas para `Sticker` y `OPP blco o blanco`.

Conclusion: Autoadhesivas tiene logica propia en Excel. No hay evidencia suficiente para afirmar que `obra_90g` impacta Autoadhesivas. Por eso `obra_90g` no debe mostrarse como producto afectado por Autoadhesivas.

## 5. Caso especifico: obra_90g vs Autoadhesivas

Pregunta auditada:

> Por que en Autoadhesivas se puede modificar papel obra?

Resultado:

- No se encontro evidencia suficiente de que `obra_90g` conecte con Autoadhesivas.
- En el Excel historico, Autoadhesivas aparece en contextos propios como `Sticker`, `OPP blco o blanco`, autoadhesivo 90 y materiales especificos.
- `obra_90g` si tiene conexion con Stickers Circulares a traves del modelo editable calibrado actual.
- La UI y el mapa de impacto no deben sugerir que modificar `obra_90g` afecta Autoadhesivas.

Decision:

- `obra_90g` debe permanecer conectada a Stickers Circulares.
- Autoadhesivas debe usar sus variables/configs propios.
- Si una pantalla muestra `Tipo: papel` en Autoadhesivas, ese label debe entenderse como selector comercial de Autoadhesivas, no como costo editable `obra_90g`.

## 6. Clasificacion de candidatas

### A. Lista para implementar primero

| Candidata | Producto | Evidencia | Motivo | Tests minimos sugeridos |
|---|---|---|---|---|
| `laca_uv_factor_stickers_circulares` | Stickers Circulares | `circulares`, `Laminado`, `formula_editable_config.json` | Ya existe como componente en formula editable calibrada. Alcance acotado. | Caso sin laca, caso con laca, trazabilidad con recargo, preview sin cambiar otros productos. |

Recomendacion:

La primera variable nueva a implementar deberia ser `laca_uv_factor_stickers_circulares`, con preview, rollback y QA masivo obligatorio. Es la candidata con menor riesgo relativo porque Stickers Circulares ya usa formula editable calibrada.

### B. Implementables con cuidado

| Candidata | Producto | Evidencia | Riesgo | Requisito antes de implementar |
|---|---|---|---|---|
| `coeficiente_tamano_stickers_circulares` | Stickers Circulares | `circulares`, `formula_editable_config.json` | Afecta muchos formatos. | Editor controlado por tabla y tests por primer/ultimo formato. |
| `coeficiente_cantidad_stickers_circulares` | Stickers Circulares | `circulares`, `formula_editable_config.json` | Afecta todos los volumenes. | Preview por cantidad y comparacion con PDF objetivo. |
| `material_base_fluo_kraft_marron` | Stickers Circulares | `formula_editable_config.json`, Excel con materiales | Materiales historicos no siempre separados igual que UI. | Separar fluo/kraft si la evidencia comercial lo confirma. |
| `click_a3_base` o `click_a3plus_base` | Stickers Circulares/Bajadas futuras | `circulares`, `Bajadas`, `Pack` | Nombre generico puede sobregeneralizar impacto. | Separar por familia y prohibir impacto automatico en matrices PDF fijas. |
| `troquelado_digital_tabla` | Bajadas adicional | `troquelados`, PDF hoja de troqueles | Es tabla por rango y complejidad, no variable escalar. | Editor de tabla protegida, tests de rangos frontera. |
| `factor_xa3_autoadhesivas` | Autoadhesivas | `autoadhesivas_v1_config.json`, hoja `Bajadas` | Impacto comercial directo. | Confirmar alcance y test de A3+/XA3. |
| `tinta_blanca_base_1_copia` extendida | Autoadhesivas | `autoadhesivas_v1_config.json` | Ya operativa como base proporcional; extenderla requiere criterio comercial. | Tests 1, 10, 30, 53 unidades y acumulacion con laca UV. |

### C. Solo documentadas por ahora

| Candidata | Motivo para no habilitar aun |
|---|---|
| Matriz Laca UV Bajadas | Ya fue corregida por matriz comercial. Debe mantenerse protegida hasta tener editor de tabla con QA. |
| Laminado por lado Bajadas | Existe logica historica, pero debe editarse como tabla/escala, no como variable simple. |
| Plastificado A3 | Hoja `Laminado` muestra A3; aplicacion comercial a A3+/XA3 ya esta modelada. No exponer sin editor protegido. |
| Papeles de Bajadas por gramaje | Excel tiene costos, pero precios finales actuales son PDF/matrices. |
| Autoadhesivo 90g y OPP blanco/clear | Hay evidencia historica, pero el motor actual requiere separacion segura antes de editar. |
| Material iman / IMAN ILPEA | Excel tiene costos, pero Imanes/Plancha usan precios PDF finales. |
| Puntas redondas y Agujereado | Excel historico tiene rangos, pero falta validacion comercial/PDF suficiente para activar precios. |
| Multiplicadores por producto | Excel tiene coeficientes dispersos; falta normalizacion por familia. |

### D. No habilitar como editable

| Elemento | Motivo |
|---|---|
| `precio_final` | Es resultado, no variable. |
| `precio_pdf` / `precio_objetivo_pdf` | Fuente final validada, no editable desde admin comun. |
| `matriz_pdf` | No debe editarse como variable suelta. |
| `factor_ajuste_pdf` | Es calibracion/auditoria, no control comercial directo sin flujo especial. |
| `rango` | Es clave de seleccion, no costo. |
| `total_final` | Es resultado calculado. |
| `OPP stickers circulares` | Permanece bloqueado por datos insuficientes. |
| Conexion `obra_90g` -> Autoadhesivas | No comprobada en Excel historico. |

## 7. Diferencia entre precio final PDF y conexion logica Excel

El PDF/lista sigue siendo la fuente confiable de precio final publicado.

El Excel historico sirve para:

- identificar costos base;
- reconstruir formulas;
- entender coeficientes;
- detectar relaciones producto/material/adicional;
- justificar futuras variables editables.

Pero una conexion historica no implica que el precio final actual deba recalcularse automaticamente. Cuando el Excel no reproduce el PDF vigente, la regla vigente del proyecto es:

1. mantener el precio final PDF;
2. documentar la formula historica;
3. calcular o conservar factor de ajuste si corresponde;
4. habilitar variables solo con preview, trazabilidad y QA.

## 8. Recomendacion de siguiente implementacion

Primera etapa recomendada:

`laca_uv_factor_stickers_circulares`

Alcance:

- Solo Stickers Circulares.
- Solo formula editable calibrada existente.
- No afecta Bajadas, Autoadhesivas, Tarjetas, Folletos, Carpetas, Sobres, Imanes ni Plancha.

Flujo requerido:

1. Exponer variable en admin con label especifico.
2. Preview obligatorio antes de guardar.
3. Trazabilidad mostrando factor anterior/nuevo.
4. Backup automatico.
5. Rollback.
6. QA masivo.

## 9. Tests sugeridos para la proxima etapa

Tests de impacto:

- Cambiar `laca_uv_factor_stickers_circulares` modifica solo casos de Stickers Circulares con laca.
- Stickers Circulares sin laca no cambia.
- `obra_90g` sigue sin afectar Autoadhesivas.
- Autoadhesivas no aparece como producto afectado por `obra_90g`.
- Matrices PDF fijas no cambian por variables historicas preparadas.

Tests de precios:

- Stickers Circulares `10cm / con_laca_uv / 1000 = 85980` con config actual.
- Bajadas Kraft `80g / 4/0 / 1 = 782`.
- Folletos `A4 / 80g / escala_grises / 1/1 / 1000 = 119247`.
- Autoadhesiva con laca UV suma una sola vez.
- Autoadhesiva con tinta blanca usa base `603`.

Tests de UI/admin:

- El mapa de impacto no sobregeneraliza por nombres parecidos.
- Variables preparadas se muestran como no conectadas si no impactan hoy.
- Labels distinguen costo de material historico de selector comercial.

## 10. Cambios realizados en esta etapa

Cambios de codigo:

- Ninguno.

Cambios de precios:

- Ninguno.

Cambios de matrices PDF:

- Ninguno.

Cambios de configuracion operativa:

- Ninguno.

Documentacion creada:

- `docs/AUDITORIA_VARIABLES_EDITABLES_CANDIDATAS.md`

## 11. Veredicto

La auditoria confirma que hay una base razonable para avanzar hacia variables editables, pero no todas las variables historicas deben operar hoy.

La proxima variable recomendada es `laca_uv_factor_stickers_circulares`, por estar acotada a un producto con formula editable calibrada y tener evidencia historica suficiente.

El caso `obra_90g` vs Autoadhesivas queda resuelto asi:

- `obra_90g` no debe afectar Autoadhesivas.
- Autoadhesivas no debe aparecer como producto afectado por `obra_90g`.
- La conexion confirmada de `obra_90g` es con Stickers Circulares.

