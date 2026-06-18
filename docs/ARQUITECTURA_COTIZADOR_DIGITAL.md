# Arquitectura del Cotizador Digital

## 1. Objetivo del sistema

El Cotizador Digital es una aplicación interna para cotizar productos digitales de Promo Directa.

El sistema ordena la información comercial y técnica para que el cálculo de precios sea más claro, trazable y mantenible.

Fuentes principales:

- `lista-low.pdf`: fuente confiable de precios finales publicados.
- `Copia de DIGITAL sistema 2025.xlsx`: fuente histórica de lógica, fórmulas y variables base.
- Sistema actual: normalización moderna de matrices, variables, endpoints y validaciones.

Regla central:

- No se inventan precios.
- Si no hay datos confiables, el producto o dato queda bloqueado.
- Los precios finales publicados se toman del PDF o de matrices validadas contra esa fuente.
- La edición operativa de variables se realiza desde el sistema, no desde el Excel maestro.
- El Excel maestro queda como visualización, auditoría, soporte y exportación.

---

## 2. Tecnologías principales

### Backend

- Python
- API HTTP interna con estructura equivalente a FastAPI/servicios de rutas
- Servicios internos por producto
- Tests con `unittest`

### Frontend

- React
- Vite
- JavaScript
- Componentes en `frontend/src`

### Exportaciones

- Exportación PDF de tablas finales
- Excel maestro exportable como documento de soporte/auditoría
- `openpyxl` para generar y validar Excel
- Validación exhaustiva del Excel maestro

### Administración de precios

- `Modificar precios` expone solo variables operativas editables mediante un wizard guiado.
- Todo guardado requiere preview previo asociado al valor ingresado.
- Antes de escribir se genera backup de la configuración afectada.
- Cada cambio queda registrado en historial operativo.
- Las matrices PDF, factores de ajuste no editables y productos bloqueados no se escriben desde esta pantalla.

El wizard usa los endpoints existentes de administración:

- `GET /admin-precios/variables-editables`
- `POST /admin-precios/preview`
- `POST /admin-precios/aplicar`
- `GET /admin-precios/historial`

La mejora es de flujo y seguridad visual: elegir variable, revisar impacto, ingresar valor, previsualizar, confirmar y ver historial.

### Navegación UX por tareas

La interfaz principal se organiza por intención del usuario, no por módulos técnicos:

- `Cotizar`: cálculo diario de productos.
- `Modificar precios`: edición operativa segura de variables conectadas.
- `Entender un precio`: detalle del cálculo y trazabilidad visual avanzada.
- `Ver impacto de cambios`: análisis preventivo antes de tocar costos.
- `Historial y backups`: bitácora de cambios y respaldos.
- `Exportar soporte Excel`: Excel maestro como soporte, auditoría y exportación.
- `Configuración avanzada`: vistas técnicas, costos base, variables principales y configuración interna.

Las pantallas técnicas siguen existiendo, pero quedan agrupadas bajo nombres operativos o avanzados para reducir riesgo de uso incorrecto.

### QA

- `unittest`
- Playwright / E2E cuando corresponde
- Scripts PowerShell
- QA masivo de precios

---

## 3. Estructura general del proyecto

Carpetas principales:

```text
src/
```

Contiene backend, motores y servicios:

- `api/`
- `export/`
- `pricing_variables/`
- módulos de productos

```text
frontend/
```

Contiene la interfaz web:

- `src/`
- `components/`
- `api/`
- `tests/e2e/`

```text
data/
```

Contiene matrices, configuraciones y fuentes normalizadas:

- `bajadas_v2/`
- `bajadas_autoadhesivas/`
- `stickers_circulares/`
- `variables_principales/`
- otras matrices/configs por producto

```text
docs/
```

Contiene documentación:

- guías operativas
- auditorías
- documentación de variables principales

```text
scripts/
```

Contiene utilidades:

- `qa/`
- `deploy_local/`

```text
tests/
```

Contiene tests automatizados, especialmente:

- `api/`

```text
reports/
```

Contiene reportes generados:

- `exports/`
- `qa/`

```text
logs/
```

Contiene logs locales, por ejemplo:

- `deploy_local/`

`reports/` y `logs/` son artefactos locales y no deben commitearse.

---

## 4. Backend

El backend expone endpoints para cotizar, consultar variables, exportar datos y validar configuraciones.

Endpoints principales:

- `GET /health`
- `POST /bajadas-v2/cotizar`
- `GET /variables-principales`
- `PUT /variables-principales`
- `GET /variables-principales/audit`
- `POST /variables-principales/reset`
- `GET /variables-principales/rangos`
- `GET /export/precios/json`
- `GET /export/precios/pdf`
- `GET /export/precios/excel`

Cada endpoint debe mantener compatibilidad con el frontend y conservar trazabilidad suficiente para auditar el resultado.

Los endpoints de cotización no deben aceptar silenciosamente combinaciones inválidas. Si falta información confiable, deben devolver un error claro.

---

## 5. Frontend

El frontend corre con Vite/React.

URL local:

```text
http://127.0.0.1:5174
```

La pantalla principal permite:

- Cotizar productos
- Modificar precios operativos con preview
- Entender un precio mediante detalle y trazabilidad
- Ver impacto de cambios antes de guardar
- Revisar historial y backups
- Revisar variables principales en configuración avanzada
- Exportar PDF
- Exportar soporte Excel maestro
- Ver rangos y estados comerciales
- Revisar trazabilidad avanzada del cálculo

Archivos clave:

- `frontend/src/components/CotizadorBajadasV2.jsx`
- `frontend/src/api/bajadasV2Api.js`
- `frontend/src/styles.css`
- `frontend/tests/e2e/cotizador-bajadas-v2.spec.js`

---

## 6. Datos y matrices

El sistema distingue distintos tipos de datos:

- Matrices PDF fijas
- Variables madre
- Variables preparadas
- Valores derivados
- Productos bloqueados

Las matrices PDF fijas representan precios finales publicados. No se editan como variables.

Las variables madre operativas son valores base modificables desde el sistema.

Las variables preparadas pueden venir del Excel histórico, pero todavía no impactan precios reales.

Los valores derivados salen de cálculos o matrices. No se editan directamente.

---

## 7. Variables principales

Servicio principal:

```text
src/pricing_variables/principal_variables.py
```

Este servicio administra:

- Variables madre operativas
- Variables preparadas
- Papeles detectados sin costo base
- Valores derivados
- Tablas fijas
- Rangos fijos

Variables operativas actuales:

- `tipo_cambio_usd`
- `click_color`
- `obra_90g`
- `multiplicador_general`
- `adicional_tinta_blanca_base_1_copia`

Campos importantes:

- `editable`
- `editable_en_sistema`
- `editable_en_excel_maestro`
- `impacta_hoy`
- `estado_operativo`
- `productos_afectados`
- `source_file`
- `source_path`
- `source_sheet`
- `source_cell`

Una variable operativa debe poder trazarse hasta su fuente y debe tener reglas claras de impacto.

---

## 8. Productos implementados

Productos activos:

- Bajadas Fullcolor
- Bajadas Blanco y Negro
- Bajadas Kraft
- Bajadas Autoadhesivas
- Troquelado digital
- Stickers circulares
- Tarjetas troqueladas circulares
- Tarjetas personales 9x5
- Tarjetas postales
- Folletos
- Carpetas
- Sobres
- Stickers corte recto
- Imanes corte recto
- Plancha imán impreso
- Agendas / Cuadernos

Bloqueados o pendientes:

- Membretes
- DTF UV
- DTF Textil
- PegaManía
- OPP stickers circulares, si sigue bloqueado
- Terminaciones tarjetas, si siguen sin datos confiables

---

## 9. Exportador PDF

Endpoint:

```text
GET /export/precios/pdf
```

Objetivo:

Exportar las tablas finales vigentes en PDF.

Aclaración importante:

El PDF exportado muestra tablas finales, pero no significa que esas tablas sean editables.

Es una salida de consulta y revisión, no una fuente editable.

---

## 10. Exportador Excel maestro

Endpoint:

```text
GET /export/precios/excel
```

Archivo generado:

```text
cotizador_digital_maestro_YYYYMMDD_HHMMSS.xlsx
```

Hojas principales:

- `00_RESUMEN`
- `01_VARIABLES_MADRE`
- `02_RANGOS`
- hojas de productos
- `18_BLOQUEADOS`
- `19_TRAZABILIDAD`
- `21_TRAZABILIDAD_PRECIOS`

La hoja `21_TRAZABILIDAD_PRECIOS` explica de dónde provienen precios testigo y cómo se componen: tabla PDF, variables madre, adicionales, factores, derivados o bloqueados.

Archivos clave:

- `src/export/precios_excel_exporter.py`
- `src/export/precios_tables_builder.py`
- `scripts/qa/validar_excel_maestro.py`

El Excel maestro sirve para auditar y ordenar el sistema. No reemplaza automáticamente al sistema ni al PDF oficial.

---

## 11. Validación del Excel maestro

Script:

```powershell
python scripts\qa\validar_excel_maestro.py
```

Debe validar:

- Que el Excel abre con `openpyxl`
- Que tiene hojas obligatorias
- Que no tiene caracteres rotos
- Que contiene variables madre
- Que contiene bloqueados
- Que contiene trazabilidad
- Que precios testigo coinciden
- Que `validacion_excel = ok`

Reporte generado en:

```text
reports/exports/validacion_excel_maestro_YYYYMMDD_HHMMSS.json
```

`reports/` no se commitea.

---

## 12. QA y tests

Comandos comunes:

```powershell
python -m unittest tests/api/test_variables_principales_api.py
python -m unittest tests/api/test_bajadas_v2_api.py
python -m unittest tests/api/test_tarjetas_9x5_api.py
python -m unittest tests/api/test_tarjetas_postales_folletos_api.py
python -m unittest tests/api/test_productos_restantes_api.py
powershell -ExecutionPolicy Bypass -File .\scripts\qa\run_qa_precios.ps1
cd frontend
cmd /c npm run build
```

Resultado esperado:

```text
QA masivo 42 PASS / 0 FAIL
Build frontend PASS
```

---

## 13. Arranque local

Entrar al proyecto:

```powershell
cd "C:\Users\baezl\Desktop\proyectos\desgloceExcel\excel_desfloce"
```

Levantar cotizador local:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy_local\start_cotizador_local.ps1
```

Backend:

```text
http://127.0.0.1:8000
```

Frontend:

```text
http://127.0.0.1:5174
```

Health:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/health -UseBasicParsing
```

---

## 14. Túnel Cloudflare

Comando:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy_local\start_all_with_tunnel.ps1 -BuildFrontend
```

Notas:

- El túnel genera una URL pública `trycloudflare`.
- No cerrar la consola de `cloudflared`.
- Si se cierra, cambia la URL.
- Para renovar backend sin cambiar túnel, reiniciar solo Python si el túnel sigue abierto.

---

## 15. Archivos que no se commitean

No commitear:

- `reports/`
- `reports/exports/`
- `logs/`
- `frontend/dist/`
- `__pycache__/`
- `*.pyc`
- archivos `.xlsx` generados
- reportes JSON generados
- backups temporales
- exports temporales

---

## 16. Flujo recomendado de trabajo

Flujo recomendado:

1. Crear cambio.
2. Correr tests específicos.
3. Correr QA masivo.
4. Correr build frontend.
5. Revisar `git status`.
6. Limpiar logs, reports, dist y backups generados.
7. Commit.
8. Tag si corresponde.
9. Push.
10. Verificar repo limpio.

---

## 17. Versionado y tags importantes

Tags relevantes:

- `v-variables-principales-editables-ok`
- `v-productos-restantes-versionados-ok`
- `v-variables-rangos-export-pdf-ok`
- `v-modelo-variables-madre-tablas-fijas-ok`
- `v-excel-maestro-exportable-validado-ok`
- `v-documentacion-operativa-cotizador-ok`, si existe

---

## 18. Regla de seguridad del sistema

El sistema debe preferir bloquear antes que inventar.

Si una fuente no es confiable:

- No se cotiza automáticamente.
- No se hace editable.
- No se inventa precio.
- Se documenta como bloqueado o detectado sin costo base.

Esta regla protege la confiabilidad comercial del cotizador.

---

## 19. Entender un precio y trazabilidad visual

El sistema expone una vista operativa llamada `Entender un precio`.

La primera capa muestra el detalle del cálculo. La capa avanzada conserva `Trazabilidad visual`.

Backend:

- Endpoint: `GET /trazabilidad/grafo`.
- Devuelve nodos, relaciones y leyenda para explicar cómo se conecta una variable madre, un derivado, un factor o una tabla PDF con el precio final.
- Es read-only: no modifica precios, variables, matrices ni configuración.

Casos iniciales:

- Click Bajadas por formato: `click_color -> precio_click_A3 -> precio_click_XL / precio_click_A4`.
- Stickers Circulares con fórmula editable calibrada.
- Autoadhesivas Tinta Blanca.
- Tarjetas 9x5 con matriz PDF.

Regla importante:

- En Bajadas, A3 es la base proporcional de click.
- XL y A4 derivan desde A3.
- XL y A4 no son variables madre editables.
