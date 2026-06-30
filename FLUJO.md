# Flujo del cotizador

## 1. Que hace este proyecto

Este proyecto es un cotizador grafico para productos de imprenta digital. Permite elegir producto, formato, material, cantidad, terminaciones y adicionales, y devuelve un precio validado contra listas comerciales/PDF.

Ademas de cotizar, el sistema muestra trazabilidad, impacto de variables, administracion de precios, backups, historial y exportes de soporte para auditar cambios sin perder control comercial.

## 2. Como fluye una cotizacion paso a paso

1. El usuario completa el formulario principal en la pantalla del cotizador.

2. `CotizadorBajadasV2.jsx` actua como orquestador visual.
   Renderiza el formulario, tabs, resultado, paneles administrativos y conecta hooks con componentes.

3. `useCotizacionForm` administra el estado del formulario.
   Normaliza campos segun categoria, calcula opciones disponibles y deriva datos como rango, cantidad, formato, material y contexto de cotizacion.

4. `cotizacionLogic.js` contiene reglas puras de negocio usadas por el formulario.
   Ahi viven funciones como inferencia de producto, rangos, terminaciones, descripcion de materiales, scopes y resumen de cotizacion.

5. Cuando el usuario presiona `Calcular`, `useCotizacionSubmit` valida campos obligatorios.
   Las validaciones de cantidad, rango, producto y combinaciones soportadas siguen dentro de este hook.

6. `useCotizacionSubmit` llama a `payloadBuilders.js`.
   Este modulo construye el payload correcto para cada familia de producto:
   tarjetas, folletos, carpetas, sobres, stickers, imanes, agendas o bajadas.

7. `payloadBuilders.js` tambien decide que endpoint llamar mediante `dispatchCotizacion`.
   Por ejemplo, Stickers Corte Recto va a `/stickers-corte-recto/cotizar`, Folletos va a `/folletos/cotizar` y Bajadas usa `/bajadas-v2/cotizar`.

8. El backend calcula el precio.
   Puede usar matriz PDF fija, formula editable calibrada, variables madre, adicionales o reglas especificas segun producto.

9. La respuesta vuelve al frontend.
   `useCotizacionSubmit` guarda:
   `result`, `lastPayload`, estados de carga, errores y datos necesarios para copiar/exportar.

10. El usuario ve el precio final.
    La UI muestra total, unitario si corresponde, rango aplicado, adicionales y trazabilidad resumida.

11. Si el usuario abre trazabilidad visual, `useTraceGraph` usa `lastPayload` y `result`.
    El grafo se construye con funciones puras de `traceGraphEngine.js`.

12. Si el usuario abre modificar precios, `useAdminPrices` carga variables editables.
    El sistema filtra variables segun la cotizacion actual y permite preview antes de guardar.

13. Si el usuario abre impacto de cambios, `useImpactMap` muestra que productos y cotizaciones se verian afectadas por una variable.

14. Si el usuario abre configuracion avanzada, `useConfigManager` gestiona configs, candidatos, backups, restauraciones y simulaciones.

15. Si el usuario exporta soporte, el sistema genera datos/Excel de auditoria con precios, variables, bloqueados y trazabilidad.

## 3. Donde vive cada responsabilidad

| Archivo | Que hace |
| --- | --- |
| `frontend/src/components/CotizadorBajadasV2.jsx` | Orquestador principal. Conecta hooks, constantes, formulario, resultado y tabs. No deberia concentrar reglas nuevas si pueden vivir en hooks o `lib`. |
| `frontend/src/hooks/useCotizacionForm.js` | Estado y normalizacion del formulario. Calcula opciones disponibles, rango derivado, cantidad, formato, material, gramaje y contexto inferido. |
| `frontend/src/hooks/useCotizacionSubmit.js` | Envio de cotizacion. Valida, arma payload via `payloadBuilders`, llama API, guarda `result` y `lastPayload`, gestiona errores, copia y exportes principales. |
| `frontend/src/hooks/useTraceGraph.js` | Estado de trazabilidad visual: modo, grafo, zoom, pan, fullscreen, nodo seleccionado y errores del grafo. |
| `frontend/src/hooks/useAdminPrices.js` | Administracion de precios editables: carga variables, preview, aplicar cambios, historial y rollback. |
| `frontend/src/hooks/useConfigManager.js` | Configuracion avanzada: configs, diferencias, candidatos, validacion, simulacion, backups y restauracion. |
| `frontend/src/hooks/useImpactMap.js` | Mapa de impacto de variables. Carga relaciones y sugiere variables relevantes segun la cotizacion actual. |
| `frontend/src/lib/cotizacionLogic.js` | Funciones puras de negocio del frontend: inferencias, rangos, scopes, labels, descripcion de terminaciones, resumen de cotizacion y formateo. |
| `frontend/src/lib/payloadBuilders.js` | Construye payloads por familia de producto y despacha al endpoint correcto. No usa React. |
| `frontend/src/lib/traceGraphEngine.js` | Funciones puras para construir, simplificar y diagramar grafos de trazabilidad. No usa React. |
| `frontend/src/components/tabs/TraceVisualTab.jsx` | UI de trazabilidad visual. Recibe props y renderiza el grafo, controles y detalle del nodo. |
| `frontend/src/components/tabs/AdminPricesTab.jsx` | UI de modificar precios. Muestra variables, preview, confirmacion, historial y rollback. |
| `frontend/src/components/tabs/VariableImpactTab.jsx` | UI de impacto de cambios. Muestra variables, productos afectados y contexto de cotizacion actual. |
| `frontend/src/components/tabs/ConfigTab.jsx` | UI de configuracion avanzada y validaciones/candidatos. |
| `frontend/src/components/tabs/HistoryBackupsTab.jsx` | UI de historial, backups, detalles y restauraciones. |
| `frontend/src/components/tabs/ExportSupportTab.jsx` | UI para exportar soporte Excel/documentacion de precios. |
| `frontend/src/components/tabs/PrincipalVariablesTab.jsx` | UI de variables principales seguras, auditoria y carga desde Excel maestro. |
| `frontend/src/api/bajadasV2Api.js` | Cliente HTTP del frontend. Expone funciones para cotizar, healthchecks, admin, exportes y endpoints de soporte. |
| `src/*` | Motores backend por producto, pricing, trazabilidad, variables y rutas API. |
| `data/*` | Matrices PDF, configs editables, factores, trazas Excel, bloqueados y datos comerciales. |
| `tests/*` y `frontend/tests/e2e/*` | Pruebas API, logica, regresion de precios, admin y flujo visual. |
| `scripts/qa/run_qa_integral.ps1` | QA integral. Verifica build, API, precios reales, tests backend y E2E. |

## 4. Como agregar un producto nuevo

1. Confirmar fuente de verdad.
   Definir si el precio final viene de PDF/lista, formula Excel, formula calibrada o producto bloqueado.

2. Crear datos en `data/<producto>/`.
   Guardar matriz PDF, trazabilidad Excel, factores de ajuste y bloqueos si corresponden.

3. Crear motor backend en `src/<producto>/`.
   Debe validar payload, calcular total, devolver precio y trazabilidad enriquecida.

4. Crear endpoint propio en backend.
   No mezclar productos nuevos dentro de `/bajadas-v2/cotizar` salvo que sea realmente una bajada/adicional de bajada.

5. Agregar cliente API en `frontend/src/api/bajadasV2Api.js`.
   Crear una funcion tipo `cotizarNuevoProducto(payload)`.

6. Agregar categoria/opciones en `CotizadorBajadasV2.jsx`.
   Incluir constantes visibles: formatos, cantidades, terminaciones, papeles, materiales, etc.

7. Actualizar `useCotizacionForm`.
   Agregar deteccion de categoria, normalizacion de campos, opciones disponibles y cantidad/rango si aplica.

8. Actualizar `cotizacionLogic.js`.
   Agregar inferencia del contexto, product key, labels, scope y descripcion si el producto participa en trazabilidad/impacto.

9. Actualizar `payloadBuilders.js`.
   Agregar el payload en la familia existente o crear una funcion si no encaja. Agregar tambien el dispatch API.

10. Agregar UI condicional.
    Mostrar solo campos necesarios para el producto. Evitar heredar campos de Bajadas si no corresponden.

11. Agregar trazabilidad.
    Asegurar que `result` tenga suficiente detalle para `TraceVisualTab`, `traceGraphEngine` y paneles de auditoria.

12. Agregar variables editables solo si hay base segura.
    Actualizar impacto, admin y exportes si el producto tiene variables conectadas.

13. Agregar tests.
    Cubrir casos exitosos, errores, precios testigo, trazabilidad y, si aplica, E2E.

14. Correr QA integral.
    Usar:
    `powershell -ExecutionPolicy Bypass -File .\scripts\qa\run_qa_integral.ps1`

## 5. Como modificar una regla de negocio existente

1. Identificar el producto y la fuente de verdad.
   No cambiar un precio por intuicion. Revisar PDF/lista, Excel historico, JSON de datos o configuracion editable.

2. Ubicar donde vive la regla.
   Puede estar en backend, `data/*`, `cotizacionLogic.js`, `payloadBuilders.js`, `useCotizacionForm` o en un hook/admin.

3. Separar regla de UI.
   Si cambia el calculo, normalmente vive en backend o datos.
   Si cambia solo visibilidad/opciones del formulario, suele vivir en `useCotizacionForm` o el JSX del formulario.

4. Si cambia el payload, modificar `payloadBuilders.js`.
   Mantener el shape que espera el backend y no duplicar logica en `handleSubmit`.

5. Si cambia una validacion frontend, modificar `useCotizacionSubmit`.
   Las validaciones previas al envio viven ahi.

6. Si cambia una inferencia o scope, modificar `cotizacionLogic.js`.
   Ejemplos: producto actual, rango actual, terminacion actual, variables aplicables.

7. Si cambia trazabilidad visual, modificar `traceGraphEngine.js` si es logica pura o `TraceVisualTab.jsx` si es presentacion.

8. Si cambia administracion de precios, modificar `useAdminPrices` y/o backend admin.
   Debe preservar preview, backup, historial y rollback.

9. Si cambia impacto contextual, modificar `useImpactMap`, `impact_map.py` o datos relacionados.

10. Agregar o ajustar tests.
    Como minimo: caso feliz, error esperado, no regresion de precio final y, si aplica, E2E.

11. Correr QA integral.
    No cerrar una regla comercial si queda `FAIL` o `ERROR`.

12. No commitear artefactos.
    Excluir `reports/`, `logs/`, `frontend/dist/`, `test-results/`, backups generados y `__pycache__`.

## 6. Glosario de terminos del dominio

| Termino | Significado |
| --- | --- |
| Bajada | Producto impreso por hoja/plancha, normalmente A4, A3, A3+, XA3 u otros formatos. Incluye Fullcolor/ByN, Kraft y Autoadhesivas. |
| Autoadhesiva | Variante de Bajadas sobre material autoadhesivo. Tiene reglas propias de laca UV, tinta blanca y restricciones de adicionales. |
| Matriz PDF | Tabla de precios tomada del PDF/lista comercial. Es fuente confiable de precio final cuando no hay formula operativa equivalente. |
| Formula editable calibrada | Formula tecnica con variables editables que se calibra para seguir respetando el precio final validado contra PDF/lista. |
| Variable madre | Variable comercial base, como dolar, click color, papel, multiplicador o adicional. Puede estar operativa o preparada. |
| Variable operativa | Variable editable que hoy impacta un motor real o una regla conectada. |
| Variable preparada | Variable detectada y lista para futuro, pero que hoy no cambia precios finales. |
| Scope | Alcance de una variable. Define a que producto, formato, cantidad, terminacion o material aplica. |
| Scope exacto | Filtro que evita mostrar variables de otros productos o contextos parecidos. Por ejemplo, variables de Stickers Corte Recto no deben aparecer como principales en Bajadas. |
| Rango | Tramo de cantidad usado para buscar precio o adicional, por ejemplo `51 a 100`. |
| Cantidad exacta | Cantidad fija de matriz, por ejemplo 100, 200, 300, 500 o 1000. No usa rango flexible. |
| Terminacion | Acabado del producto, como sin laminar, laca UV, laminado brillo, laminado mate o laca UV brillo. |
| Adicional | Costo extra acumulable o seleccionable, como troquelado, laca, tinta blanca, plastificado o laminado. |
| Trazabilidad | Explicacion del precio: entrada del usuario, variables usadas, tabla/fuente, rango, adicionales, subtotal y total final. |
| Grafo de trazabilidad | Visualizacion de la trazabilidad como nodos y conexiones. Se construye en frontend a partir de payload y resultado. |
| Impacto | Relacion entre una variable editable y los productos/casos que podria afectar. |
| Impacto contextual | Impacto calculado contra la cotizacion actual, no solo contra el mapa general. |
| Candidato | Configuracion propuesta que todavia no fue promovida a final. Permite validar antes de activar. |
| Preview | Simulacion previa de un cambio. Muestra valor actual, nuevo valor, diferencia y productos afectados antes de guardar. |
| Backup | Copia de configuracion creada antes de aplicar cambios importantes. Permite recuperar estado anterior. |
| Rollback | Restauracion de una variable o configuracion a un valor anterior registrado. |
| Historial | Registro de cambios aplicados, previews, backups y rollbacks. |
| PDF fijo | Modo donde el precio final se mantiene igual a la matriz PDF/lista aunque existan variables tecnicas de soporte. |
| Producto bloqueado | Producto o opcion sin datos confiables suficientes. No debe inventar precios. |
| QA integral | Suite automatizada que valida precios reales, API, build, E2E y reglas clave del cotizador. |

