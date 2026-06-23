# Variables editables para Tarjetas, Postales y Folletos

Proyecto: cotizador digital

Punto seguro base: `v-variables-stickers-imanes-corte-recto-ok`

## Objetivo

Agregar variables editables contextuales para Tarjetas 9x5, Tarjetas Postales y Folletos sin modificar los precios finales validados contra PDF/lista.

Estas variables preparan una capa de explicacion y edicion controlada para futuros modelos de formula calibrada.

## Regla de seguridad

Los precios finales actuales siguen saliendo de la matriz PDF/lista y de reglas comerciales ya validadas, por ejemplo el recargo 350g. Las variables nuevas no convierten automaticamente estas ramas en formula libre.

Si la cotizacion actual usa matriz PDF/lista fija, la UI debe decirlo claramente y no afirmar un impacto directo si el motor actual no recalcula desde esa variable.

## Tarjetas 9x5

Variables agregadas:

- `factor_gramaje_tarjetas_9x5_350g`
- `factor_laca_uv_tarjetas_9x5`
- `factor_laminado_brillo_tarjetas_9x5`
- `factor_laminado_mate_tarjetas_9x5`
- `multiplicador_comercial_tarjetas_9x5`
- `coeficiente_cantidad_tarjetas_9x5_100`
- `coeficiente_cantidad_tarjetas_9x5_200`
- `coeficiente_cantidad_tarjetas_9x5_300`
- `coeficiente_cantidad_tarjetas_9x5_500`
- `coeficiente_cantidad_tarjetas_9x5_1000`
- `coeficiente_impresion_tarjetas_9x5_4_0`
- `coeficiente_impresion_tarjetas_9x5_4_4`

Archivo de datos:

- `data/tarjetas_9x5/formula_editable_config.json`

## Tarjetas Postales

Variables agregadas:

- `factor_gramaje_tarjetas_postales_350g`
- `factor_laca_uv_tarjetas_postales`
- `factor_laminado_brillo_tarjetas_postales`
- `factor_laminado_mate_tarjetas_postales`
- `multiplicador_comercial_tarjetas_postales`
- `coeficiente_cantidad_tarjetas_postales_100`
- `coeficiente_cantidad_tarjetas_postales_200`
- `coeficiente_cantidad_tarjetas_postales_300`
- `coeficiente_cantidad_tarjetas_postales_500`
- `coeficiente_cantidad_tarjetas_postales_1000`
- `coeficiente_impresion_tarjetas_postales_4_0`
- `coeficiente_impresion_tarjetas_postales_4_4`

Archivo de datos:

- `data/tarjetas_postales/formula_editable_config.json`

## Folletos

Variables agregadas:

- `multiplicador_comercial_folletos`
- `factor_papel_folletos_80g`
- `factor_papel_folletos_150g`
- `factor_formato_folletos_10x10`
- `factor_formato_folletos_10x15`
- `factor_formato_folletos_15x21`
- `factor_formato_folletos_A4`
- `factor_color_folletos_fullcolor`
- `factor_color_folletos_escala_grises`
- `factor_impresion_folletos_4_0`
- `factor_impresion_folletos_4_4`
- `factor_impresion_folletos_1_0`
- `factor_impresion_folletos_1_1`
- `coeficiente_cantidad_folletos_100`
- `coeficiente_cantidad_folletos_200`
- `coeficiente_cantidad_folletos_300`
- `coeficiente_cantidad_folletos_500`
- `coeficiente_cantidad_folletos_1000`

Archivo de datos:

- `data/folletos/formula_editable_config.json`

## Variables no expuestas

No se exponen como editables directas:

- Precios finales PDF/lista.
- Matrices PDF completas.
- `precio_objetivo_pdf`.
- `factor_ajuste_pdf` crudo.
- Terminaciones bloqueadas por falta de datos, como puntas redondeadas y agujerado.

## Tests esperados

- Precios testigo de Tarjetas, Postales y Folletos no cambian.
- Variables nuevas aparecen en catalogo editable.
- Variables se scopean por producto, gramaje, terminacion, cantidad, formato, modo de color o caras segun corresponda.
- Variables de estos productos no aparecen como principales de Bajadas, Stickers o Imanes cuando la cotizacion actual no corresponde.
- Preview, backup, historial y rollback funcionan mediante el sistema admin de precios.
