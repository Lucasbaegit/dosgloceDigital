# Variables editables - Carpetas, Sobres, Plancha Iman y Agendas/Cuadernos

## Objetivo

Esta etapa agrega variables editables contextuales para productos restantes ya activos:

- Carpetas
- Sobres
- Plancha de Iman Impreso
- Agendas / Cuadernos

El objetivo es preparar administracion, trazabilidad, preview, historial y rollback sin modificar los precios finales validados contra PDF/lista.

## Fuente final y fuente logica

- Precio final vigente: `lista-low.pdf`.
- Logica historica: `Copia de DIGITAL sistema 2025.xlsx`.
- Configuracion operativa editable:
  - `data/carpetas/formula_editable_config.json`.
  - `data/sobres/formula_editable_config.json`.
  - `data/plancha_iman_impreso/formula_editable_config.json`.
  - `data/agendas_cuadernos/formula_editable_config.json`.

## Convencion de calculo

Los precios comerciales finales se conservan desde matrices PDF/lista ya validadas.

Las variables agregadas son contextuales: explican componentes tecnicos, factores, coeficientes y multiplicadores que pueden modificarse desde administracion para preview, trazabilidad y futuras formulas calibradas.

Cuando una variable cambia, el sistema puede mostrar impacto tecnico/contextual, crear backup, registrar historial y permitir rollback. El precio final de los casos testigo sigue calibrado contra PDF/lista mientras el motor del producto permanezca en modo matriz PDF.

## Carpetas

Variables expuestas:

- `factor_solapa_carpetas`.
- `factor_laca_uv_carpetas`.
- `factor_laminado_carpetas`.
- `multiplicador_comercial_carpetas`.
- `coeficiente_terminacion_carpetas_sin_laminar`.
- `coeficiente_terminacion_carpetas_laca_uv`.
- `coeficiente_terminacion_carpetas_laminado_brillo`.
- `coeficiente_terminacion_carpetas_laminado_mate`.
- `coeficiente_impresion_carpetas_4_0`.
- `coeficiente_impresion_carpetas_4_4`.
- `coeficiente_cantidad_carpetas_1`.
- `coeficiente_cantidad_carpetas_2_a_25`.
- `coeficiente_cantidad_carpetas_26_a_50`.
- `coeficiente_cantidad_carpetas_51_a_100`.
- `coeficiente_cantidad_carpetas_101_a_300`.
- `coeficiente_cantidad_carpetas_301_a_500`.
- `coeficiente_cantidad_carpetas_501_a_1000`.

Alcance contextual:

- Producto: Carpetas.
- Endpoint: `/carpetas/cotizar`.
- Aplica por terminacion, caras, rango de cantidad y solapa impresa segun corresponda.

## Sobres

Variables expuestas:

- `multiplicador_comercial_sobres`.
- `coeficiente_tipo_sobre_sobre_bolsa_a4_22_9x32_4`.
- `coeficiente_tipo_sobre_sobre_bolsa_27x37`.
- `coeficiente_tipo_sobre_sobre_bolsa_25x35_3`.
- `coeficiente_tipo_sobre_oficio_ingles_12x23_5`.
- `coeficiente_cantidad_sobres_100`.
- `coeficiente_cantidad_sobres_200`.
- `coeficiente_cantidad_sobres_300`.
- `coeficiente_cantidad_sobres_500`.
- `coeficiente_cantidad_sobres_1000`.

Alcance contextual:

- Producto: Sobres.
- Endpoint: `/sobres/cotizar`.
- Aplica por tipo de sobre y cantidad exacta.

## Plancha de Iman Impreso

Variables expuestas:

- `base_iman_plancha`.
- `papel_300g_ilustracion_plancha_iman`.
- `multiplicador_comercial_plancha_iman`.
- `coeficiente_variante_plancha_iman_papel_300g_ilustracion`.
- `coeficiente_cantidad_plancha_iman_1`.
- `coeficiente_cantidad_plancha_iman_2_a_25`.
- `coeficiente_cantidad_plancha_iman_26_a_50`.
- `coeficiente_cantidad_plancha_iman_51_a_100`.
- `coeficiente_cantidad_plancha_iman_101_a_300`.
- `coeficiente_cantidad_plancha_iman_301_a_500`.

Alcance contextual:

- Producto: Plancha de Iman Impreso.
- Endpoint: `/plancha-iman-impreso/cotizar`.
- Aplica por variante y rango de cantidad.

## Agendas / Cuadernos

Variables expuestas:

- `base_agenda_2026`.
- `factor_tapa_agendas`.
- `factor_anillado_agendas`.
- `multiplicador_comercial_agendas`.
- `coeficiente_producto_agendas_cuaderno_escolar_abrochado`.
- `coeficiente_producto_agendas_cuaderno_universitario_ringwire`.
- `coeficiente_producto_agendas_agenda_2026`.
- `coeficiente_formato_agendas_A5`.
- `coeficiente_formato_agendas_A4`.
- `coeficiente_paginas_agendas_24`.
- `coeficiente_paginas_agendas_48`.
- `coeficiente_paginas_agendas_72`.
- `coeficiente_paginas_agendas_100`.
- `coeficiente_paginas_agendas_160`.

Alcance contextual:

- Producto: Agendas / Cuadernos.
- Endpoint: `/agendas-cuadernos/cotizar`.
- Aplica por producto, formato y cantidad de paginas.

## Impacto contextual

Las relaciones se registran en `src/pricing_trace/impact_map.py`.

En `Modificar precios`, una cotizacion actual de Carpetas solo muestra como principales las variables de Carpetas aplicables a la combinacion actual. Lo mismo ocurre con Sobres, Plancha Iman y Agendas/Cuadernos.

Estas variables no deben aparecer como principales para Bajadas, Tarjetas, Folletos, Stickers o Imanes Corte Recto.

## Preview, backup, historial y rollback

El flujo administrativo usa `src/admin_precios/service.py` y el catalogo de `src/pricing_variables/principal_variables.py`.

Cada variable editable permite:

- preview con valor actual, valor nuevo, diferencia y productos afectados;
- aplicacion confirmada;
- backup previo;
- registro en historial;
- rollback desde historial/backups.

## Export e import Excel maestro

El exportador Excel identifica estos productos como:

`matriz_pdf_con_variables_contextuales`

El importador permite importar solo las variables allowlistadas de estos productos. No importa matrices PDF ni precios finales como variables madre.

## Variables no expuestas

No se expone ningun `precio_final`, `precio_pdf`, `precio_objetivo_pdf`, `factor_ajuste_pdf`, `rango`, `total_final` ni `matriz_pdf` como variable madre editable.

## Tests de aceptacion

Los tests agregados validan:

- existencia en catalogo editable;
- scope contextual en mapa de impacto;
- no contaminacion de Bajadas;
- preview, backup, historial y persistencia;
- preservacion de precios PDF/lista testigo;
- import Excel maestro controlado;
- E2E de Modificar precios e Impacto de cambios.
