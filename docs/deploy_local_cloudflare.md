# Deploy local con Cloudflare Tunnel (Bajadas v2)

## Objetivo
Exponer el cotizador para otras computadoras con una sola URL pública temporal usando Cloudflare Tunnel.

## Opción elegida
**Opción A (recomendada): origen único**.

- La API Python puede servir el frontend compilado (`frontend/dist`) en `/`.
- El túnel apunta a **un solo puerto**: `http://127.0.0.1:8000`.
- Resultado: una sola URL pública para UI + API.

## Requisitos
- Python en PATH
- Node.js + npm en PATH
- `cloudflared` en PATH

## Scripts creados
- `scripts/deploy_local/build_frontend.ps1`
- `scripts/deploy_local/start_cotizador_local.ps1`
- `scripts/deploy_local/check_cotizador_local.ps1`
- `scripts/deploy_local/start_cloudflare_tunnel.ps1`
- `scripts/deploy_local/start_all_with_tunnel.ps1`

## Flujo recomendado (origen único)
1. Compilar frontend:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy_local\build_frontend.ps1
```

2. Levantar API (sirve también el frontend compilado en `/`):

```powershell
python scripts\bajadas_v2\run_api_bajadas_v2.py --host 127.0.0.1 --port 8000
```

3. Verificar salud local:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy_local\check_cotizador_local.ps1
```

4. Levantar túnel:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy_local\start_cloudflare_tunnel.ps1 -Port 8000
```

Cloudflare mostrará una URL `https://...trycloudflare.com` para compartir.

## Flujo alternativo (dev local + túnel)
Levanta API y Vite por separado con logs en `logs/deploy_local/`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy_local\start_cotizador_local.ps1
```

## Flujo todo-en-uno
(Construye opcionalmente, levanta servicios y abre túnel)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy_local\start_all_with_tunnel.ps1 -BuildFrontend
```

## URLs locales
- API health: `http://127.0.0.1:8000/health`
- API funcional: `http://127.0.0.1:8000/bajadas-v2/health`
- UI (build servido por API): `http://127.0.0.1:8000`

## Nota sobre frontend/API en producción
El frontend usa base URL relativa en build (misma origin), por eso funciona detrás del túnel sin hardcodear `127.0.0.1`.
En desarrollo mantiene `http://127.0.0.1:8000` como API base.

## Seguridad mínima
- TryCloudflare genera URL pública **temporal**.
- Cualquiera con la URL puede acceder.
- No usar para datos sensibles.
- Próximo paso recomendado: proteger con Cloudflare Access (login) antes de uso externo real.

## Cómo apagar
- Cerrar la terminal de `cloudflared`.
- Cerrar el proceso de API (y Vite si se usó modo dev).
