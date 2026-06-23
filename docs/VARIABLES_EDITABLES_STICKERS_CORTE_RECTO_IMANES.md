# Variables editables - Stickers Corte Recto e Imanes Corte Recto

## Objetivo

Esta etapa agrega variables editables contextuales para Stickers Corte Recto e Imanes Corte Recto sin modificar los precios finales validados contra PDF/lista.

## Fuente final y fuente lógica

- Precio final vigente: `lista-low.pdf`, página 15.
- Lógica histórica: `Copia de DIGITAL sistema 2025.xlsx` como referencia de materiales, cortes, laca, formatos, cantidades y multiplicadores.
- Configuración operativa editable:
  - `data/stickers_corte_recto/formula_editable_config.json`.
  - `data/imanes_corte_recto/formula_editable_config.json`.

## Convención de cálculo

El precio final publicado se conserva desde la matriz PDF/lista.

La fórmula editable reconstruida calcula una base técnica:

```text
Stickers Corte Recto:
((material_base + click_color_base * coeficiente_formato) * laca_uv_factor * corte_recto_factor * coeficiente_cantidad) * multiplicador_comercial

Imanes Corte Recto:
((base_iman + papel_300g_ilustracion + click_color_base * coeficiente_formato) * laca_uv_factor * corte_recto_factor * coeficiente_cantidad) * multiplicador_comercial
```

Luego se calcula:

```text
factor_ajuste_pdf = precio_pdf_objetivo / precio_base_estimado
precio_final = precio_pdf_objetivo
```

Esto permite editar variables y ver impacto técnico/contextual sin romper el precio comercial vigente.

## Variables de Stickers Corte Recto

- `factor_laca_uv_stickers_corte_recto`: aplica solo cuando la terminación actual es `con_laca_uv`.
- `corte_recto_factor_stickers_corte_recto`: aplica al producto completo.
- `multiplicador_comercial_stickers_corte_recto`: aplica al producto completo.
- `coeficiente_formato_stickers_corte_recto_6x4`.
- `coeficiente_formato_stickers_corte_recto_7x5`.
- `coeficiente_formato_stickers_corte_recto_9x5`.
- `coeficiente_formato_stickers_corte_recto_10x7`.
- `coeficiente_cantidad_stickers_corte_recto_100`.
- `coeficiente_cantidad_stickers_corte_recto_200`.
- `coeficiente_cantidad_stickers_corte_recto_300`.
- `coeficiente_cantidad_stickers_corte_recto_500`.
- `coeficiente_cantidad_stickers_corte_recto_1000`.

## Variables de Imanes Corte Recto

- `factor_laca_uv_imanes_corte_recto`: aplica solo cuando la terminación actual es `con_laca_uv`.
- `corte_recto_factor_imanes_corte_recto`: aplica al producto completo.
- `multiplicador_comercial_imanes_corte_recto`: aplica al producto completo.
- `coeficiente_formato_imanes_corte_recto_6x4`.
- `coeficiente_formato_imanes_corte_recto_7x5`.
- `coeficiente_formato_imanes_corte_recto_9x5`.
- `coeficiente_formato_imanes_corte_recto_10x7`.
- `coeficiente_cantidad_imanes_corte_recto_100`.
- `coeficiente_cantidad_imanes_corte_recto_200`.
- `coeficiente_cantidad_imanes_corte_recto_300`.
- `coeficiente_cantidad_imanes_corte_recto_500`.
- `coeficiente_cantidad_imanes_corte_recto_1000`.

## Impacto contextual

Las variables se registran en `src/pricing_trace/impact_map.py` con alcance por:

- producto;
- formato;
- cantidad;
- terminación cuando corresponde.

En `Modificar precios`, una cotización de Stickers Corte Recto 10x7 x1000 con laca muestra solo variables de Stickers Corte Recto aplicables a formato `10x7`, cantidad `1000` y terminación `con_laca_uv`.

Una cotización de Imanes Corte Recto muestra solo variables de Imanes Corte Recto.

Una cotización de Bajadas, Tarjetas, Folletos u otros productos no muestra estas variables como principales de la cotización actual.

## Preview, backup, historial y rollback

Las variables son gestionadas por el administrador de precios:

- preview antes de guardar;
- backup automático por archivo de configuración;
- historial con variable, valor anterior y valor nuevo;
- rollback desde historial.

Los paths quedan explícitos, por ejemplo:

- `variables.coeficiente_tamano.10x7`.
- `variables.coeficiente_cantidad.1000`.

## Factor de ajuste PDF

`factor_ajuste_pdf` no se expone como editable en esta etapa.

Motivo: es un derivado de calibración que asegura la coincidencia con PDF/lista. Editarlo directamente sería equivalente a tocar la calibración comercial final sin una UI protegida ni validación específica.

## Casos testigo preservados

- Stickers Corte Recto, 100 unidades, 6x4, sin laca: `2765`.
- Stickers Corte Recto, 1000 unidades, 10x7, con laca: `61703`.
- Imanes Corte Recto, 100 unidades, 6x4, sin laca: `7526`.
- Imanes Corte Recto, 1000 unidades, 10x7, con laca: `153680`.

## Export soporte Excel

El Excel maestro debe mostrar estos productos como `formula_editable_calibrada` en trazabilidad, manteniendo la tabla final PDF como precio publicado.
