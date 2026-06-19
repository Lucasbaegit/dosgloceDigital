# Validacion de conexiones contra Excel historico

## 1. Archivo Excel revisado

- Archivo: `C:\Users\baezl\Desktop\proyectos\desgloceExcel\Copia de DIGITAL sistema 2025.xlsx`
- Fecha de auditoria: 2026-06-19
- Criterio: el PDF/lista validada sigue siendo fuente de precios finales. El Excel historico se usa solo para trazabilidad logica, variables y conexiones entre materiales, clicks, adicionales y productos.

## 2. Hojas y zonas consultadas

- `circulares!C8:K20`: formulas historicas de stickers circulares por diametro y cantidad.
- `circulares!N23:S38`: referencias a clicks/rangos y laminado/troquelado usadas por la hoja `circulares`.
- `Bajadas!S4:S10`: columna historica `Sticker`.
- `Bajadas!U4:U10`: columna historica `OPP blco o blanco`.
- `Bajadas!Z3:AI14`: costos de papel por hoja usados para Bajadas.
- `Pack!K2:M24`: bloques historicos donde `90g` y `autoadhesivo` son columnas separadas.
- `PAPEL US$!B5:E8`: costos historicos de `obra 90g`.
- `PAPEL US$!B10:E15`: costos historicos de `ilustracion 90g`.
- `PAPEL US$!B31:E33`: costos historicos de `autoadhesivo 90`.
- `PAPEL US$!B36:F37`: OPP blanco/clear, detectado pero no normalizado como variable operativa general.

## 3. Variables revisadas

- `obra_90g`
- `click_color`
- `multiplicador_general`
- `tipo_cambio_usd`
- `adicional_tinta_blanca_base_1_copia`
- Variables preparadas historicas `obra_90g_65x95_usd`, `obra_90g_72x102_usd`, `autoadhesivo_90g_50x65_usd`, `autoadhesivo_90g_100x70_usd`.

## 4. Productos revisados

- Stickers Circulares
- Bajadas Autoadhesivas
- Bajadas Fullcolor/ByN
- Administrador de precios / mapa de impacto
- Pantalla de variables principales

## 5. Conexiones confirmadas

### `obra_90g` -> Stickers Circulares

Confirmada como conexion operativa del sistema actual, no como costo directo de una celda unica del Excel. El motor de Stickers Circulares usa `data/stickers_circulares/formula_editable_config.json`, variable `variables.material_base.obra_ilustracion_90g`, dentro de la formula editable calibrada.

Evidencia historica:

- `circulares!C8:K20` contiene formulas para stickers circulares por cantidad y diametro.
- `circulares!P8` identifica el componente `PAPEL`.
- `circulares!P23:Q30` referencia precios de `Bajadas!E4:F11`.
- La formula reconstruida se calibra contra PDF hoja 8 con `data/stickers_circulares/factores_ajuste_pdf.json`.

Conclusion: `obra_90g` impacta hoy Stickers Circulares y no debe mostrarse como variable operativa de Autoadhesivas.

### `adicional_tinta_blanca_base_1_copia` -> Bajadas Autoadhesivas

Confirmada como conexion operativa del sistema actual por configuracion propia:

- Archivo: `data/bajadas_autoadhesivas/autoadhesivas_v1_config.json`
- Campo: `adicional_tinta_blanca_base_1_copia`
- Regla: proporcional por cantidad desde valor base de 1 copia.

Conclusion: esta es la variable madre operativa de Autoadhesivas para Tinta Blanca.

## 6. Conexiones descartadas

### `obra_90g` -> Bajadas Autoadhesivas

No se encontro evidencia suficiente para conectar `obra_90g` con Bajadas Autoadhesivas.

Evidencia:

- `PAPEL US$!B5:E8` define `obra 90g`.
- `PAPEL US$!B31:E33` define `autoadhesivo 90` como costo separado.
- `Bajadas!S4:S10` contiene la columna historica `Sticker`.
- `Bajadas!U4:U10` contiene la columna historica `OPP blco o blanco`.
- `Pack!K2:M24` muestra `90g` y `autoadhesivo` como columnas distintas, no como un unico papel obra compartido.

Conclusion: Autoadhesivas no debe aparecer como producto afectado por `obra_90g`. El campo visible de Autoadhesivas es tipo/columna comercial de autoadhesivo, no costo madre de papel obra.

## 7. Conexiones dudosas o no comprobadas

- OPP general: el Excel muestra `PAPEL US$!B36:F37`, pero no alcanza para exponer una variable madre operativa general sin confirmar cual valor es base.
- Autoadhesivo 90g historico: existen `PAPEL US$!E31` y `PAPEL US$!E33`, pero hoy no estan conectadas al motor productivo de Autoadhesivas. Quedan preparadas/no conectadas.
- Clicks historicos de Bajadas: existen referencias en `Bajadas` y `Pack`, pero Bajadas productivas actuales siguen usando matrices PDF finales y reglas puntuales ya validadas.

## 8. Diferencia entre precio final PDF y conexion logica Excel

- Los precios finales publicados se validan contra PDF/lista.
- El Excel historico explica relaciones entre componentes, pero no siempre reproduce el PDF vigente.
- Cuando una formula historica no reproduce PDF, el sistema usa precio final PDF y conserva trazabilidad/factor de ajuste.

## 9. Caso especifico `obra_90g` vs Autoadhesivas

Pregunta: "Por que en Autoadhesivas se puede modificar papel obra?"

Respuesta: no deberia presentarse asi. La confusion venia del catalogo administrativo de `papeles_detectados`: como existia una variable operativa llamada `obra_90g`, el listado de `Papeles Bajadas` marcaba `obra_90g` como variable madre editable por coincidencia de nombre. Eso sobregeneralizaba el impacto.

Correccion aplicada:

- `obra_90g` queda como variable operativa de `Papeles Stickers Circulares`.
- En `Papeles Bajadas`, `obra_90g` queda como detectado sin costo base operativo conectado para esa familia.
- Autoadhesivas no aparece como producto afectado por `obra_90g`.
- El campo de UI de Autoadhesivas se aclara como `Tipo de autoadhesivo`, con opciones comerciales propias.

## 10. Cambios realizados en codigo o UI

- `src/pricing_variables/principal_variables.py`
  - Label de `obra_90g` aclarado como `Papel obra/ilustración 90g (Stickers Circulares)`.
  - Descripcion aclara que no esta conectado a Bajadas Autoadhesivas.
  - `papeles_detectados` separa `Papeles Stickers Circulares` de `Papeles Bajadas`.
  - Se evita marcar `obra_90g` como editable por coincidencia de nombre en familias donde no aplica.

- `frontend/src/components/CotizadorBajadasV2.jsx`
  - Autoadhesivas muestra `Tipo de autoadhesivo`.
  - Las opciones visibles son `Papel autoadhesivo` y `OPP blanco / especial`.
  - Se agrega nota aclaratoria: no edita la variable `obra_90g` de Stickers Circulares.

## 11. Tests agregados o actualizados

- `tests/api/test_variables_principales_api.py`
  - Verifica que `obra_90g` afecta solo Stickers Circulares.
  - Verifica que `obra_90g` no aparece editable dentro de `Papeles Bajadas` ni `Papeles Autoadhesivas`.

- `tests/api/test_variables_impacto_api.py`
  - Verifica que `/variables-impacto/variable/obra_90g` no incluya `bajadas_autoadhesivas`.
  - Verifica que la variable operativa de Autoadhesivas sea `adicional_tinta_blanca_base_1_copia`.

