# Uso local estable del cotizador digital

Esta guía explica cómo usar el cotizador desde esta computadora, sin dominio fijo, VPS, usuarios, permisos ni túneles Cloudflare.

## 1. Prender el sistema

Desde la raíz del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local\iniciar_cotizador_local.ps1
```

También podés usar el acceso directo simple:

```bat
iniciar_cotizador.bat
```

El script inicia:

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5174`

Por defecto abre el navegador si el frontend responde. Para no abrir navegador:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local\iniciar_cotizador_local.ps1 -NoBrowser
```

Para reiniciar procesos locales del cotizador:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local\iniciar_cotizador_local.ps1 -Restart
```

## 2. Apagar el sistema

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local\apagar_cotizador_local.ps1
```

O con el acceso directo:

```bat
apagar_cotizador.bat
```

El apagado busca procesos relacionados con este proyecto y evita matar procesos no relacionados cuando es posible. No toca `cloudflared`.

## 3. URL para usar todos los días

Abrir:

```text
http://127.0.0.1:5174
```

## 4. Verificar si está funcionando

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local\verificar_cotizador_local.ps1
```

La salida esperada es:

- Backend OK
- Frontend OK
- Admin precios OK
- Trazabilidad OK
- Export Excel OK
- Sistema listo

## 5. Hacer backup manual local

Antes de cambios importantes de precios o configuración:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local\backup_local.ps1
```

El backup se guarda en:

```text
backups/local/manual_YYYYMMDD_HHMMSS/
```

Incluye datos, documentación, código backend/frontend fuente y scripts. No incluye `node_modules`, `frontend/dist`, logs, reportes, `__pycache__` ni `.pyc`.

No commitear backups generados.

## 6. Limpiar temporales

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local\limpiar_temporales_local.ps1
```

Limpia logs temporales, reportes QA temporales, resultados E2E, `__pycache__`, `.pyc` y debug logs.

No borra:

- `data/`
- configs productivas
- historial real
- backups reales

## 7. Si no abre

1. Ejecutar verificación local.
2. Revisar logs en `logs/deploy_local/`.
3. Reiniciar con:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local\iniciar_cotizador_local.ps1 -Restart
```

## 8. Si el puerto 8000 o 5174 está ocupado

Usar `-Restart` para apagar procesos locales del cotizador y volver a iniciar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local\iniciar_cotizador_local.ps1 -Restart
```

Si el puerto lo ocupa otro programa no relacionado, cerrarlo manualmente o cambiar el puerto con:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local\iniciar_cotizador_local.ps1 -ApiPort 8001 -FrontendPort 5175
```

## 9. Archivos que no hay que tocar a mano

- `data/`
- matrices PDF y JSON de precios
- backups internos
- historial de cambios de precios
- `frontend/dist/`
- logs y reportes generados

Los cambios de precios se hacen desde la pestaña `Modificar precios`. El Excel maestro es soporte y auditoría, no la fuente operativa para editar precios directamente.

## 10. Qué significa usarlo localmente

El sistema corre en esta computadora. Mientras los procesos estén encendidos, se accede desde `127.0.0.1`. No queda publicado en internet.

## 11. Qué NO incluye esta etapa

- Dominio fijo.
- VPS.
- Cloudflare Named Tunnel.
- Usuarios o permisos.
- Deploy productivo remoto.

Esta etapa busca estabilidad y comodidad para uso diario local.
