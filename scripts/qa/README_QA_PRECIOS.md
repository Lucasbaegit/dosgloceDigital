# QA Masivo e Integral del Cotizador

Esta carpeta contiene herramientas de regresión para controlar que el cotizador siga calculando contra datos reales esperados y que los endpoints principales sigan sanos.

## 1. Levantar backend/frontend local

Para uso diario recomendado:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local\iniciar_cotizador_local.ps1
```

También se puede usar el script histórico:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy_local\start_cotizador_local.ps1
```

La API esperada es:

```text
http://127.0.0.1:8000
```

## 2. QA masivo de precios

Ejecuta cotizaciones API contra precios esperados y genera reporte JSON/CSV.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\qa\run_qa_precios.ps1
```

### Ejecutar por grupo

```powershell
python .\scripts\qa\qa_precios_masivo.py --only bajadas
python .\scripts\qa\qa_precios_masivo.py --only autoadhesivas
python .\scripts\qa\qa_precios_masivo.py --only tarjetas
```

### Listar casos disponibles

```powershell
python .\scripts\qa\qa_precios_masivo.py --list
```

## 3. QA integral funcional

La suite integral es la alarma principal antes de tocar variables, precios, productos o lógica de cotización.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\qa\run_qa_integral.ps1
```

La suite integral ejecuta:

- healthchecks de backend y productos principales;
- endpoints de configuración, variables, trazabilidad y exports;
- las 42 cotizaciones del QA masivo contra precios esperados;
- tests API/unittest relevantes;
- build frontend;
- E2E Playwright con API local existente.

### Comandos útiles

Listar todos los checks sin ejecutar:

```powershell
python .\scripts\qa\qa_integral_app.py --list
```

Correr sin E2E para una validación más rápida:

```powershell
python .\scripts\qa\qa_integral_app.py --skip-e2e
```

Cortar ante el primer fallo:

```powershell
python .\scripts\qa\qa_integral_app.py --fail-fast
```

Configurar API, frontend o salida:

```powershell
python .\scripts\qa\qa_integral_app.py --base-url http://127.0.0.1:8000 --frontend-url http://127.0.0.1:5174 --output-dir .\reports\qa
```

## 4. Reportes

Los reportes se guardan en:

- `reports\qa\qa_precios_YYYYMMDD_HHMMSS.json`
- `reports\qa\qa_precios_YYYYMMDD_HHMMSS.csv`
- `reports\qa\qa_integral_app_YYYYMMDD_HHMMSS.json`
- `reports\qa\qa_integral_app_YYYYMMDD_HHMMSS.csv`

No commitear `reports/` ni artefactos generados.

## 5. Interpretación PASS/FAIL

- `PASS`: el status, total, error esperado o checks extra coinciden.
- `FAIL`: la API respondió, pero difiere el resultado esperado.
- `ERROR`: hubo excepción, timeout o el comando no pudo completarse.
- Si la API no responde, levantar el sistema local antes de ejecutar QA.

## 6. Cuándo usar cada QA

Usar QA masivo de precios cuando se toca una regla puntual de cotización.

Usar QA integral cuando se toca cualquiera de estos puntos:

- variables principales;
- precios;
- matrices;
- endpoints;
- trazabilidad;
- exportaciones;
- frontend operativo;
- scripts de uso local;
- lógica de productos.

## 7. Agregar un caso nuevo

Para precios, editar `scripts\qa\qa_precios_masivo.py` en `build_cases()` y agregar:

- `id`, `grupo`, `nombre`;
- `endpoint`;
- `payload`;
- `expected_status`;
- `expected_total_sin_iva` o `expected_error`;
- opcional `checks` para validar campos extra.

Para endpoints o comandos integrales, editar `scripts\qa\qa_integral_app.py` y agregar el check en `API_GET_CHECKS` o en la lista de comandos correspondiente.

## 8. Artefactos que no se commitean

No commitear:

- `reports/`;
- `frontend/dist/`;
- `frontend/test-results/`;
- `logs/`;
- backups generados por tests;
- `__pycache__/`;
- `*.pyc`;
- `debug.log`.
