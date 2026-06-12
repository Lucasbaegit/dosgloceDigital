# Guía para modificar precios en el Cotizador Digital

## 1. Regla principal

No todos los precios se modifican igual.

El Cotizador Digital separa la información en distintos tipos:

- Variables madre editables
- Variables preparadas sin impacto actual
- Valores derivados
- Tablas PDF fijas
- Productos bloqueados

La regla central es simple:

**Solo se modifican variables madre operativas. No se modifican precios finales a mano.**

Esto evita cambios aislados sin trazabilidad y mantiene alineado el sistema con sus fuentes confiables.

---

## 2. Dónde se modifican precios

Los cambios seguros se hacen desde la sección:

```text
Variables principales
```

Las variables operativas actuales son:

- `tipo_cambio_usd`
- `click_color`
- `obra_90g`
- `multiplicador_general`
- `adicional_tinta_blanca_base_1_copia`

Estas variables deben figurar con:

- `editable_en_sistema = true`
- `impacta_hoy = true`
- `estado_operativo = operativa`

Cuando una variable cumple esas condiciones, el sistema la considera una variable real de operación.

---

## 3. Qué NO se debe modificar manualmente

No se deben modificar directamente:

- Precio final
- Precio unitario final
- Precio por rango
- Matrices PDF
- Factores de ajuste
- Totales finales
- Recargos finales calculados
- Tablas exportadas
- Productos bloqueados

Ejemplo incorrecto:

```text
Cambiar a mano el precio final de Tarjetas 9x5, cantidad 100.
```

Ejemplo correcto:

```text
Actualizar una variable madre operativa o cargar una nueva matriz validada desde una fuente confiable.
```

Si un producto usa tabla fija PDF, no se corrige una celda suelta. Se actualiza la matriz completa con trazabilidad.

---

## 4. Qué pasa cuando se modifica una variable madre

Cuando se modifica una variable madre, el sistema debe:

1. Validar que la variable exista.
2. Verificar que sea editable.
3. Verificar que el valor sea numérico.
4. Verificar que el valor no sea inválido.
5. Guardar el cambio.
6. Generar backup.
7. Aplicar el impacto en los productos conectados, si corresponde.

No todas las variables visibles modifican precios reales. Solo las variables operativas lo hacen.

---

## 5. Variables que impactan hoy

`impacta_hoy = true` significa que cambiar la variable puede modificar precios reales del cotizador.

Ejemplos:

- `click_color`
- `obra_90g`
- `tipo_cambio_usd`
- `adicional_tinta_blanca_base_1_copia`

Estas variables están conectadas al sistema actual.

Antes de modificarlas conviene revisar qué productos dependen de ellas y correr QA después del cambio.

---

## 6. Variables preparadas pero no conectadas

Algunas variables vienen del Excel histórico y aparecen en el Excel maestro, pero todavía no modifican precios reales.

Ejemplos posibles:

- `ilustracion_150g`
- `ilustracion_300g`
- `triplex_350g`
- Autoadhesivos no conectados

Deben figurar como:

- `editable_en_excel_maestro = true`
- `editable_en_sistema = false`
- `impacta_hoy = false`
- `estado_operativo = preparada_no_conectada`

Estas variables se pueden documentar y preparar para etapas futuras.

Pero todavía no cambian precios del sistema y no deben importarse como cambio operativo.

---

## 7. Cómo actualizar productos con tabla fija

Los productos con tabla fija PDF no se actualizan cambiando una celda suelta.

Ejemplos:

- Tarjetas 9x5
- Tarjetas postales
- Folletos
- Carpetas
- Sobres
- Stickers corte recto
- Imanes corte recto
- Plancha imán
- Agendas / Cuadernos

Para cambiar estos precios hace falta:

1. Nueva lista PDF confiable.
2. Nueva matriz validada comercialmente.
3. Revisión formal producto por producto.
4. Tests y QA masivo.

No se debe cambiar una celda individual sin trazabilidad.

---

## 8. Cómo actualizar productos con fórmula editable

Algunos productos pueden responder a variables madre.

Ejemplo:

- Stickers circulares

Puede depender de:

- Papel base
- Click color
- Multiplicador comercial
- Laca UV
- Factor de ajuste contra PDF

Modificar una variable madre puede cambiar resultados, pero siempre debe validarse después.

El hecho de que un producto tenga fórmula editable no significa que se pueda tocar cualquier valor. Se modifican variables madre, no totales finales.

---

## 9. Cómo usar el Excel maestro para revisar precios

El Excel maestro sirve para auditar y revisar el estado del sistema.

Hojas clave:

- `00_RESUMEN`
- `01_VARIABLES_MADRE`
- `02_RANGOS`
- `18_BLOQUEADOS`
- `19_TRAZABILIDAD`
- `21_TRAZABILIDAD_PRECIOS`

El Excel maestro incluye la hoja `21_TRAZABILIDAD_PRECIOS`, donde se explica de dónde provienen precios testigo y cómo se componen: tabla PDF, variables madre, adicionales, factores, derivados o bloqueados.

La hoja más importante para revisar cambios de precios es:

```text
01_VARIABLES_MADRE
```

Pero no todo lo que aparece ahí impacta hoy.

Hay que revisar estas columnas:

- `editable_en_sistema`
- `editable_en_excel_maestro`
- `impacta_hoy`
- `estado_operativo`

---

## 10. Interpretación de columnas importantes

### `editable_en_sistema`

- `true`: se puede modificar operativamente en el sistema.
- `false`: no se puede modificar operativamente todavía.

### `editable_en_excel_maestro`

- `true`: aparece como variable editable o documentable en el Excel maestro.
- No significa necesariamente que cambie precios reales.

### `impacta_hoy`

- `true`: cambia precios actuales.
- `false`: no cambia precios todavía.

### `estado_operativo`

Valores posibles:

- `operativa`: variable conectada al sistema actual.
- `preparada_no_conectada`: variable detectada y preparada, pero sin impacto actual.
- `detectada_sin_costo_base`: dato detectado, pero sin costo base confiable.
- `bloqueada`: dato o producto no operativo por falta de información confiable.

---

## 11. Flujo recomendado para modificar precios

Flujo recomendado:

1. Revisar la variable en `Variables principales`.
2. Confirmar `editable_en_sistema = true`.
3. Confirmar `impacta_hoy = true`.
4. Modificar el valor.
5. Guardar.
6. Ejecutar QA.
7. Revisar productos afectados.
8. Exportar Excel maestro actualizado.
9. Guardar commit/tag si el cambio es importante.

Si la variable no cumple esas condiciones, no debe tratarse como cambio operativo.

---

## 12. Validaciones después de modificar precios

Después de modificar precios o variables operativas, correr:

```powershell
python -m unittest tests/api/test_variables_principales_api.py
python -m unittest tests/api/test_bajadas_v2_api.py
powershell -ExecutionPolicy Bypass -File .\scripts\qa\run_qa_precios.ps1
cd frontend
cmd /c npm run build
```

Resultado esperado:

```text
QA masivo 42 PASS / 0 FAIL
Build frontend PASS
```

Si falla algún test, no cerrar el cambio hasta revisar la causa.

---

## 13. Qué hacer si un precio no coincide

Si un precio no coincide:

1. No corregir a mano sin revisar.
2. Identificar el producto.
3. Revisar si usa tabla fija o fórmula.
4. Revisar trazabilidad.
5. Comparar con el PDF.
6. Comparar con el Excel histórico si corresponde.
7. Corregir la fuente adecuada.
8. Volver a correr QA.

La corrección debe hacerse en la fuente correcta:

- Variable madre operativa, si el producto depende de ella.
- Matriz PDF validada, si el producto usa tabla fija.
- Documentación de bloqueo, si no hay datos confiables.

---

## 14. Regla de seguridad

El sistema debe preferir bloquear antes que inventar.

Si no hay fuente confiable:

- No se cotiza automáticamente.
- No se inventa precio.
- No se hace editable.
- Se documenta como bloqueado o detectado sin costo base.

Esta regla protege al cotizador de errores comerciales difíciles de rastrear.

---

## 15. Resumen rápido

Para modificar precios:

- Editar variables madre operativas.
- No editar precios finales.
- No editar rangos.
- No editar matrices PDF.
- Validar siempre después del cambio.

Variable editable real:

```text
editable_en_sistema = true
impacta_hoy = true
estado_operativo = operativa
```

Variable solo preparada:

```text
editable_en_sistema = false
impacta_hoy = false
estado_operativo = preparada_no_conectada
```

Si hay duda, no modificar el precio. Revisar fuente, trazabilidad y QA primero.
