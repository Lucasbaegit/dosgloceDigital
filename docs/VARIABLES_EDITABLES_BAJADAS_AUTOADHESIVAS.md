# Variables editables para Bajadas y Autoadhesivas

Proyecto: cotizador digital

Punto seguro base: `v-variables-stickers-imanes-corte-recto-ok`

## Objetivo

Agregar variables editables contextuales para Bajadas y Bajadas Autoadhesivas sin modificar los precios finales validados contra PDF/lista.

Estas variables quedan disponibles para:

- Modificar precios.
- Ver impacto de cambios.
- Preview antes de guardar.
- Backup, historial y rollback del sistema de administracion de precios.
- Export soporte Excel maestro.

## Regla de seguridad

Los precios finales operativos siguen saliendo de las matrices/lista validadas y de los adicionales ya implementados. Las variables nuevas documentan y preparan la base tecnica editable, pero no reemplazan automaticamente las matrices PDF/lista.

Cuando una variable no modifica el precio final actual, la UI debe explicar que se trata de una variable documentada o contextual y que la cotizacion actual permanece calibrada contra PDF/lista.

## Variables agregadas

### Bajadas

- `factor_laca_uv_bajadas`
- `factor_troquelado_digital_bajadas`
- `multiplicador_comercial_bajadas`
- `coeficiente_formato_bajadas_A3plus`
- `coeficiente_formato_bajadas_A3`
- `coeficiente_formato_bajadas_A4`
- `coeficiente_formato_bajadas_XA3`
- `coeficiente_rango_bajadas_1`
- `coeficiente_rango_bajadas_2_25`
- `coeficiente_rango_bajadas_26_50`
- `coeficiente_rango_bajadas_51_100`
- `coeficiente_rango_bajadas_101_300`
- `coeficiente_rango_bajadas_301_500`
- `coeficiente_rango_bajadas_501_1000`

### Autoadhesivas

- `factor_laca_uv_bajadas`
- `factor_tinta_blanca_autoadhesivas`
- `multiplicador_comercial_bajadas`
- coeficientes de formato/rango compartidos con Bajadas cuando el contexto de cotizacion corresponde.

## Variables no expuestas

No se exponen como editables directas:

- Precios finales PDF/lista.
- Matrices finales completas.
- Factores de ajuste PDF crudos sin control.
- Opciones bloqueadas o no confiables.

## Alcance contextual

Las variables de Bajadas deben aparecer como relevantes solo cuando la cotizacion actual pertenezca a:

- Bajadas Fullcolor/ByN.
- Bajadas Kraft.
- Bajadas Autoadhesivas, cuando el adicional o variable corresponda.

No deben aparecer como variables principales de Stickers, Imanes, Folletos, Tarjetas, Carpetas, Sobres u otros productos.

## Trazabilidad esperada

La respuesta o panel de impacto debe poder explicar:

- Variable seleccionada.
- Producto afectado.
- Alcance por formato, rango o adicional.
- Valor actual y valor nuevo.
- Preview de impacto.
- Si modifica precio final o solo base tecnica/contextual.

## Archivos de datos

- `data/bajadas_v2/formula_editable_config.json`

## Tests esperados

- Precios testigo de Bajadas no cambian.
- Variables nuevas existen en el catalogo editable.
- El mapa de impacto no contamina otros productos.
- Preview devuelve valor actual/nuevo/diferencia.
- Guardado genera backup e historial.
- Rollback restaura valor anterior.
