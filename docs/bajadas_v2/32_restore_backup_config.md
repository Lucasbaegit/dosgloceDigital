# 32 - Restore seguro desde backup (Bajadas v2)

## Alcance
Se implementó restore productivo desde un backup específico, con validaciones de seguridad y trazabilidad completa.

## Endpoints nuevos

- `POST /bajadas-v2/config/backups/{backup_filename}/restore`
- `GET /bajadas-v2/config/backups/{backup_filename}`

## Restore seguro

`POST /bajadas-v2/config/backups/{backup_filename}/restore` requiere:

```json
{
  "confirmacion": "RESTAURAR_BACKUP_BAJADAS_V2",
  "motivo": "texto libre",
  "usuario": "local"
}
```

Validaciones aplicadas:

1. `backup_filename` debe existir en `data/bajadas_v2/backups/`.
2. Se bloquea path traversal:
   - `..`
   - rutas absolutas
   - `/`, `\`, `:`
3. Confirmación exacta obligatoria:
   - `RESTAURAR_BACKUP_BAJADAS_V2`
4. El JSON del backup se parsea y valida con la misma estructura de config (`_validate_full_config`).
5. Si falla alguna validación, no se restaura.

## Flujo de restauración

Antes de restaurar:

- se crea backup pre-restore de la config final actual:
  - `bajadas_v2_config_final_pre_restore_YYYYMMDD_HHMMSS.json`

Luego:

- se reemplaza `data/bajadas_v2/bajadas_v2_config_final.json` por el backup elegido;
- se recarga el engine productivo;
- se registra evento en `config_history.json` con:
  - `tipo: RESTORE_BACKUP`
  - `fecha`, `usuario`, `motivo`
  - `backup_restaurado`
  - `backup_pre_restore_creado`
  - `hash_backup_restaurado`
  - `hash_config_final_resultante`

## Endpoint de detalle de backup

`GET /bajadas-v2/config/backups/{backup_filename}` devuelve:

- archivo
- fecha
- tamaño
- hash
- `valid` (true/false)
- `warnings`
- `errors`

## UI (Configuración / Backups)

Se agregó:

- botón **Ver detalle** por backup;
- botón **Restaurar backup** por backup;
- prompt obligatorio con texto exacto;
- advertencia:
  - "Restaurar un backup reemplaza la configuración productiva actual. Se creará un backup previo automático."

## Nota operativa

Este restore actúa sobre `config_final` productiva.
No modifica Excel, CSV limpio ni PDF.
