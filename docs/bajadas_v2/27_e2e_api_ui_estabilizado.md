# E2E API + UI estabilizado

## Estrategia
Se mantiene supervisor Python (`scripts/bajadas_v2/run_e2e_stack.py`) con dos modos.

## Modo A — supervisor completo
Comando:
```powershell
python scripts\bajadas_v2\run_e2e_stack.py
```

Flujo:
1. Levanta API en `http://127.0.0.1:8000` si no está arriba.
2. Verifica puerto `5173` libre.
3. Levanta Vite en `127.0.0.1:5173`.
4. Healthchecks:
   - `GET /health`
   - `GET /bajadas-v2/health`
   - `GET http://127.0.0.1:5173`
5. Ejecuta Playwright.
6. Cierra solo procesos iniciados por el supervisor.

## Modo B — frontend levantado manualmente
Terminal 1:
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Terminal 2:
```powershell
cd C:\Users\baezl\Desktop\proyectos\desgloceExcel\excel_desfloce
python scripts\bajadas_v2\run_e2e_stack.py --use-existing-frontend http://127.0.0.1:5173
```

En este modo:
- no inicia Vite;
- no cierra procesos de frontend ajenos;
- valida que la URL del frontend existente responda;
- pasa `BASE_URL` a Playwright.

## Logs clave del supervisor
- `modo_ejecucion`
- `frontend_url_usada`
- `api_url_usada`
- `base_url_playwright`
- `frontend_iniciado_por_supervisor`
- `api_iniciada_por_supervisor`

## Configuración Playwright
`frontend/playwright.config.js`:
- `baseURL: process.env.BASE_URL || "http://127.0.0.1:5173"`
- tests usan `page.goto("/")` (sin puerto hardcodeado).

## Mensaje de puerto ocupado
Si `5173` está ocupado en modo A:
`Puerto 5173 ocupado. Cerrá procesos Vite anteriores o usá el supervisor para limpiar.`

## Comandos de validación
```powershell
python scripts\bajadas_v2\validar_bajadas_v2.py
python -m unittest discover -s tests\api -p "test_*.py"
```
## Actualización E2E: flujo cantidad manual

Se adaptaron los tests E2E al nuevo contrato visual/funcional:
- `Cantidad` ahora es input manual.
- `Rango aplicado (automático)` se valida en UI.
- Se verifica visualización de importes con `ARS` y totales.

Nota de entorno:
- El stack puede quedar bloqueado por `spawn EPERM` al ejecutar Playwright en este entorno Windows/sandbox. No es falla de lógica de negocio ni de payload.
