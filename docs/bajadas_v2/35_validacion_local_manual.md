# 35 - Validación Local Manual (API + Frontend ya levantados)

## Objetivo
Permitir ejecución E2E estable cuando el usuario ya levantó API y frontend manualmente, evitando que el supervisor inicie o cierre procesos.

## Nuevo flag

- `--use-existing-api http://127.0.0.1:8000`

Ya existía:

- `--use-existing-frontend http://127.0.0.1:5174`

## Comportamiento con ambos flags

Comando:

```powershell
python scripts\bajadas_v2\run_e2e_stack.py --use-existing-api http://127.0.0.1:8000 --use-existing-frontend http://127.0.0.1:5174
```

El supervisor:

1. No inicia API.
2. No inicia frontend.
3. No mata procesos de API/frontend al finalizar.
4. Ejecuta healthchecks:
   - `GET /health`
   - `GET /bajadas-v2/health`
   - health del frontend base URL.
5. Pasa variables a Playwright:
   - `BASE_URL`
   - `API_URL`
6. Ejecuta E2E y devuelve código final PASS/FAIL.

## Flujo recomendado

Terminal 1 (API):

```powershell
python scripts\bajadas_v2\run_api_bajadas_v2.py --host 127.0.0.1 --port 8000
```

Terminal 2 (frontend):

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5174
```

Terminal 3 (validación E2E):

```powershell
cd C:\Users\baezl\Desktop\proyectos\desgloceExcel\excel_desfloce
python scripts\bajadas_v2\run_e2e_stack.py --use-existing-api http://127.0.0.1:8000 --use-existing-frontend http://127.0.0.1:5174
```

## Nota

Si el frontend no responde en la URL indicada, el supervisor falla en healthcheck antes de Playwright, con salida clara en consola.
