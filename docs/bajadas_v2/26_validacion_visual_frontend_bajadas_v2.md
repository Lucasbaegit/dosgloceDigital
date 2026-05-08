# Validación visual frontend Bajadas v2

## Estado de instalación frontend
- `npm config get registry` devuelve: `https://registry.npmjs.org/`
- `npm install` inicialmente falló por acceso/permisos de red (`EACCES` a `registry.npmjs.org`).
- Reintento con permisos habilitados: `npm install` **OK**.

## Referencias visuales usadas
- Mockup dark: `C:\Users\baezl\Desktop\proyectos\desgloceExcel\imagenes\mockup dark cotizador bajadas.png`
- Logo principal: `C:\Users\baezl\Desktop\proyectos\desgloceExcel\imagenes\logoPromo.jpg`

## Validación funcional manual esperada
1. Pantalla dark visible.
2. Logo Promo visible en sidebar.
3. Campos de cotización visibles.
4. Botón `Calcular` visible.
5. `Enter` dispara cálculo.
6. Click en `Calcular` dispara cálculo.
7. Loading visible mientras consulta API.
8. Resultado y trazabilidad visibles al responder API.
9. Error controlado cuando API está caída.
10. Error claro para combinación inexistente.

## Smoke tests E2E
Archivo:
- `frontend/tests/e2e/cotizador-bajadas-v2.spec.js`

Cobertura:
- carga de pantalla
- logo visible
- campos principales visibles
- botón Calcular
- cálculo exitoso
- Enter calcula
- manejo de API caída
- manejo de combinación inexistente
- caso real contra API local (`POST /bajadas-v2/cotizar`) cuando la API está levantada

## Scripts
En `frontend/package.json`:
- `test:e2e`
- `test:e2e:ui`

## Ejecución local
```powershell
cd C:\Users\baezl\Desktop\proyectos\desgloceExcel\excel_desfloce

# API
python scripts\bajadas_v2\run_api_bajadas_v2.py --host 127.0.0.1 --port 8000

# Frontend (otra terminal)
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173

# E2E (otra terminal)
npm run test:e2e
```

## Si vuelve a fallar npm install por red/permisos
1. Verificar registry:
```powershell
npm config get registry
```
2. Forzar registry oficial:
```powershell
npm config set registry https://registry.npmjs.org/
```
3. Si persiste restricción:
- usar mirror interno corporativo
- o habilitar salida HTTPS al registry público

## Resultado observado en este entorno
- Dependencias frontend instaladas correctamente tras habilitar permisos.
- Playwright + Chromium instalados correctamente.
- E2E smoke:
  - 5 tests passed
  - 1 test real API puede fallar en este entorno si el proceso API no queda persistente en background.
